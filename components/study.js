// Funzioni di studio: evidenzia & segnalibri, glossario tap-to-define,
// condividi il paragrafo esatto. Tutto client-side, memoria su localStorage.
// Nessun accesso a window/document a livello di modulo (compatibile SSR).

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

function pageSlug() {
  const p = location.pathname.replace(/\/+$/, "");
  return p === "" ? "home" : p.split("/").pop();
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 250); }, 1800);
}

// ---- offset helpers (rispetto ai nodi testo dell'articolo) ----
function textNodes(root) {
  const out = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      let p = n.parentNode;
      while (p && p !== root) {
        const t = p.tagName;
        if (t === "SCRIPT" || t === "STYLE") return NodeFilter.FILTER_REJECT;
        p = p.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let n; while ((n = w.nextNode())) out.push(n);
  return out;
}
function offsetOf(nodes, node, off) {
  let acc = 0;
  for (const n of nodes) { if (n === node) return acc + off; acc += n.nodeValue.length; }
  return -1;
}
// avvolge l'intervallo [start,end) in <mark class=cls data-*> (gestisce più nodi)
function wrapRange(root, start, end, cls, data) {
  if (end <= start) return [];
  const nodes = textNodes(root);
  const targets = [];
  let acc = 0;
  for (const n of nodes) {
    const len = n.nodeValue.length, ns = acc, ne = acc + len; acc = ne;
    const from = Math.max(start, ns), to = Math.min(end, ne);
    if (to > from) targets.push({ node: n, from: from - ns, to: to - ns });
  }
  const marks = [];
  for (const t of targets) {
    try {
      const r = document.createRange();
      r.setStart(t.node, t.from); r.setEnd(t.node, t.to);
      const m = document.createElement("mark");
      m.className = cls;
      if (data) Object.keys(data).forEach((k) => m.setAttribute("data-" + k, data[k]));
      r.surroundContents(m);
      marks.push(m);
    } catch (e) {}
  }
  return marks;
}

// ==================== EVIDENZIA ====================
function hlKey(slug) { return "fdf-hl:" + slug; }
function applyHighlights(root, slug) {
  const list = LS.get(hlKey(slug), []);
  list.sort((a, b) => b.s - a.s); // dal fondo, così gli offset restano validi
  for (const h of list) {
    const marks = wrapRange(root, h.s, h.e, "hl", { s: h.s, e: h.e });
    marks.forEach((m) => (m.id = "hl" + h.s));
  }
}
function addHighlight(root, slug, s, e, text) {
  const list = LS.get(hlKey(slug), []);
  if (list.some((h) => h.s === s && h.e === e)) return;
  list.push({ s, e, t: (text || "").slice(0, 120) });
  LS.set(hlKey(slug), list);
  wrapRange(root, s, e, "hl", { s, e }).forEach((m) => (m.id = "hl" + s));
}
function removeHighlight(root, slug, s, e) {
  let list = LS.get(hlKey(slug), []).filter((h) => !(h.s === +s && h.e === +e));
  LS.set(hlKey(slug), list);
  root.querySelectorAll('mark.hl[data-s="' + s + '"][data-e="' + e + '"]').forEach((m) => {
    const parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m); parent.normalize();
  });
}

// ==================== GLOSSARIO ====================
function applyGlossary(root, glossary) {
  if (!glossary) return;
  const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
  const used = new Set();
  const ps = root.querySelectorAll(".col > p");
  ps.forEach((p) => {
    if (p.closest(".original,.data,.callout,.readbox,.notes,.warns")) return;
    for (const term of terms) {
      if (used.has(term)) continue;
      const nodes = textNodes(p);
      const full = nodes.map((n) => n.nodeValue).join("");
      const re = new RegExp("(^|[^\\p{L}])(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?![\\p{L}])", "iu");
      const m = re.exec(full);
      if (!m) continue;
      const start = m.index + m[1].length, end = start + m[2].length;
      // salta se dentro un elemento non idoneo
      let acc = 0, ok = true;
      for (const n of nodes) {
        const ns = acc, ne = acc + n.nodeValue.length; acc = ne;
        if (end > ns && start < ne) {
          if (n.parentNode.closest && n.parentNode.closest("a,button,.term,.info,mark.hl")) { ok = false; break; }
        }
      }
      if (!ok) continue;
      const marks = wrapRangeAs(p, start, end, "button", "term", { term });
      if (marks[0]) { marks.forEach((b) => { b.type = "button"; b.setAttribute("aria-label", "Definizione: " + term); }); used.add(term); }
    }
  });
}
// come wrapRange ma con un tag arbitrario
function wrapRangeAs(root, start, end, tag, cls, data) {
  const nodes = textNodes(root);
  const targets = []; let acc = 0;
  for (const n of nodes) {
    const len = n.nodeValue.length, ns = acc, ne = acc + len; acc = ne;
    const from = Math.max(start, ns), to = Math.min(end, ne);
    if (to > from) targets.push({ node: n, from: from - ns, to: to - ns });
  }
  const els = [];
  for (const t of targets) {
    try {
      const r = document.createRange();
      r.setStart(t.node, t.from); r.setEnd(t.node, t.to);
      const el = document.createElement(tag);
      el.className = cls;
      if (data) Object.keys(data).forEach((k) => el.setAttribute("data-" + k, data[k]));
      r.surroundContents(el); els.push(el);
    } catch (e) {}
  }
  return els;
}

// ==================== CONDIVIDI PARAGRAFO ====================
function assignAnchors(root) {
  let i = 0;
  root.querySelectorAll(".col > p, .shead, .chap-title, .pull p").forEach((el) => {
    if (!el.id) el.id = "f" + (++i);
    else i++;
  });
}
function copyLinkTo(id) {
  const url = location.origin + location.pathname + "#" + id;
  const done = () => toast("Link al paragrafo copiato");
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => toast(url));
  else toast(url);
}
function handleHash() {
  if (!location.hash) return;
  const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!el) return;
  setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 2200);
  }, 120);
}

// ==================== SEGNALIBRI ====================
function bmAll() { return LS.get("fdf-bm", []); }
function isBookmarked(slug) { return bmAll().some((b) => b.slug === slug); }
function toggleBookmark(slug, title) {
  let list = bmAll();
  if (isBookmarked(slug)) list = list.filter((b) => b.slug !== slug);
  else list.unshift({ slug, title, ts: Date.now() });
  LS.set("fdf-bm", list);
  return isBookmarked(slug);
}

// ==================== UI: barra selezione + popover glossario + pannello ====================
function buildFloatingUI(root, slug, glossary) {
  // barra su selezione
  const bar = document.createElement("div");
  bar.className = "sel-bar"; bar.hidden = true;
  bar.innerHTML =
    '<button data-act="hl">🖊 Evidenzia</button>' +
    '<button data-act="link">🔗 Copia link</button>';
  document.body.appendChild(bar);

  const pop = document.createElement("div");
  pop.className = "gloss-pop"; pop.hidden = true; document.body.appendChild(pop);

  function hideBar() { bar.hidden = true; }
  function showBarFor(rect) {
    bar.hidden = false;
    const bw = bar.offsetWidth, bh = bar.offsetHeight;
    let x = rect.left + rect.width / 2 - bw / 2 + scrollX;
    let y = rect.top - bh - 8 + scrollY;
    x = Math.max(8 + scrollX, Math.min(x, scrollX + innerWidth - bw - 8));
    if (y < scrollY + 4) y = rect.bottom + 8 + scrollY;
    bar.style.left = x + "px"; bar.style.top = y + "px";
  }
  function currentSel() {
    const sel = getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
    const r = sel.getRangeAt(0);
    if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
    const nodes = textNodes(root);
    let s = offsetOf(nodes, r.startContainer, r.startOffset);
    let e = offsetOf(nodes, r.endContainer, r.endOffset);
    if (s < 0 || e < 0) return null;
    if (s > e) { const t = s; s = e; e = t; }
    if (e - s < 2) return null;
    return { s, e, text: sel.toString(), rect: r.getBoundingClientRect(), startEl: (r.startContainer.parentElement) };
  }
  let pending = null;
  function onSelectEnd() {
    const c = currentSel();
    if (!c) { hideBar(); return; }
    pending = c; showBarFor(c.rect);
  }
  document.addEventListener("mouseup", () => setTimeout(onSelectEnd, 0));
  document.addEventListener("touchend", () => setTimeout(onSelectEnd, 0));
  document.addEventListener("selectionchange", () => { if (getSelection().isCollapsed) hideBar(); });
  bar.addEventListener("mousedown", (e) => e.preventDefault());
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || !pending) return;
    if (b.dataset.act === "hl") { addHighlight(root, slug, pending.s, pending.e, pending.text); }
    else if (b.dataset.act === "link") {
      const anchor = pending.startEl && pending.startEl.closest(".col > p, .shead, .chap-title");
      copyLinkTo(anchor ? anchor.id : (root.querySelector("[id^=f]") || {}).id || "");
    }
    getSelection().removeAllRanges(); hideBar();
  });

  // click: rimuovi evidenziazione oppure apri glossario
  root.addEventListener("click", (e) => {
    const term = e.target.closest(".term");
    if (term) {
      const key = term.dataset.term, def = glossary[key];
      pop.innerHTML = '<div class="gp-t">' + key + "</div><div class=\"gp-d\">" + (def || "") + "</div>";
      pop.hidden = false;
      const r = term.getBoundingClientRect();
      let x = r.left + scrollX, y = r.bottom + 6 + scrollY;
      x = Math.min(x, scrollX + innerWidth - pop.offsetWidth - 10);
      pop.style.left = Math.max(8, x) + "px"; pop.style.top = y + "px";
      e.stopPropagation();
      return;
    }
    const hl = e.target.closest("mark.hl");
    if (hl) {
      if (confirm("Rimuovere questa evidenziazione?")) removeHighlight(root, slug, hl.dataset.s, hl.dataset.e);
    }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".gloss-pop,.term")) pop.hidden = true; });

  // hover su paragrafo → maniglia "link" (desktop)
  const handle = document.createElement("button");
  handle.className = "para-link"; handle.title = "Copia il link a questo paragrafo"; handle.textContent = "¶"; handle.hidden = true;
  document.body.appendChild(handle);
  let hoverEl = null;
  root.addEventListener("mouseover", (e) => {
    const el = e.target.closest(".col > p, .shead");
    if (!el || !el.id) { return; }
    hoverEl = el; const r = el.getBoundingClientRect();
    handle.hidden = false;
    handle.style.top = r.top + scrollY + 2 + "px";
    handle.style.left = Math.max(4, r.left + scrollX - 26) + "px";
  });
  root.addEventListener("mouseleave", () => { handle.hidden = true; });
  handle.addEventListener("click", () => { if (hoverEl) copyLinkTo(hoverEl.id); });
}

// pannello "I miei segni"
function buildMarksPanel() {
  const panel = document.createElement("aside");
  panel.className = "marks-panel"; panel.id = "marksPanel"; panel.hidden = true;
  document.body.appendChild(panel);
  const scrim = document.createElement("div");
  scrim.className = "scrim"; scrim.hidden = true; scrim.id = "marksScrim";
  document.body.appendChild(scrim);
  scrim.addEventListener("click", () => close());
  function close() { panel.classList.remove("open"); scrim.hidden = true; setTimeout(() => (panel.hidden = true), 250); }
  function render() {
    const pageHref = (s) => (s === "home" || s === "" ? "/" : "/" + s + "/");
    const bms = bmAll();
    let hlHtml = "";
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf("fdf-hl:") !== 0) continue;
      const slug = k.slice(7); const arr = LS.get(k, []);
      if (!arr.length) continue;
      hlHtml += '<div class="mp-group"><div class="mp-slug">' + slug.replace(/-/g, " ") + "</div>" +
        arr.slice().sort((a, b) => a.s - b.s).map((h) =>
          '<a class="mp-hl" href="' + pageHref(slug) + "#hl" + h.s + '">“' + (h.t || "").replace(/</g, "&lt;") + '”</a>').join("") + "</div>";
    }
    panel.innerHTML =
      '<div class="mp-head">I miei segni <button id="mpClose" aria-label="Chiudi">✕</button></div>' +
      '<div class="mp-sec">Segnalibri</div>' +
      (bms.length ? bms.map((b) => '<a class="mp-bm" href="' + pageHref(b.slug) + '">★ ' + b.title + "</a>").join("") : '<div class="mp-empty">Nessun segnalibro. Usa ★ in alto per salvare una pagina.</div>') +
      '<div class="mp-sec">Evidenziazioni</div>' +
      (hlHtml || '<div class="mp-empty">Nessuna evidenziazione. Seleziona un testo e scegli “Evidenzia”.</div>');
    panel.querySelector("#mpClose").addEventListener("click", close);
  }
  function open() { render(); panel.hidden = false; scrim.hidden = false; requestAnimationFrame(() => panel.classList.add("open")); }
  return { open };
}

// link esterni → nuova scheda + indicatore ↗ (i link interni restano nel sito)
function markExternalLinks(root) {
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!/^https?:\/\//i.test(href)) return;
    try {
      const u = new URL(href, location.href);
      if (u.origin !== location.origin) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.classList.add("ext");
      }
    } catch (e) {}
  });
}

// pannello Domanda & Risposta (destra su PC, dal basso su mobile)
function buildQAPanel() {
  const panel = document.createElement("aside");
  panel.className = "qa-panel"; panel.hidden = true;
  document.body.appendChild(panel);
  const scrim = document.createElement("div");
  scrim.className = "scrim"; scrim.hidden = true;
  document.body.appendChild(scrim);
  function close() { panel.classList.remove("open"); scrim.hidden = true; setTimeout(() => (panel.hidden = true), 300); }
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });
  function open(qaEl) {
    const qBtn = qaEl.querySelector(".qa-q");
    const qClone = qBtn ? qBtn.cloneNode(true) : null;
    if (qClone) { const lbl = qClone.querySelector(".lbl"); if (lbl) lbl.remove(); }
    const qText = qClone ? qClone.textContent.trim() : "";
    const a = qaEl.querySelector(".qa-a");
    panel.innerHTML =
      '<div class="qp-top"><span class="qp-kick">Domanda &amp; Risposta</span>' +
      '<button class="qp-close" aria-label="Chiudi">✕</button></div>' +
      '<h2 class="qp-q"></h2><div class="qp-a"></div>';
    panel.querySelector(".qp-q").textContent = qText;
    panel.querySelector(".qp-a").innerHTML = a ? a.innerHTML : "";
    markExternalLinks(panel);
    panel.querySelector(".qp-close").addEventListener("click", close);
    panel.scrollTop = 0;
    panel.hidden = false; scrim.hidden = false;
    requestAnimationFrame(() => panel.classList.add("open"));
  }
  return { open };
}

export function initStudy(glossary) {
  const root = document.querySelector("#content .page");
  if (!root) return;
  const slug = pageSlug();
  const title = document.title.split(" — ")[0];

  assignAnchors(root);
  applyHighlights(root, slug);
  applyGlossary(root, glossary);
  buildFloatingUI(root, slug, glossary);
  const panel = buildMarksPanel();
  markExternalLinks(root);
  const qaPanel = buildQAPanel();
  root.addEventListener("click", (e) => {
    const q = e.target.closest(".qa-q");
    if (q) { e.preventDefault(); qaPanel.open(q.closest(".qa")); }
  });
  handleHash();

  // pulsante ★ segnalibro (nell'header)
  const bm = document.getElementById("bookmarkBtn");
  if (bm) {
    const sync = () => bm.classList.toggle("on", isBookmarked(slug));
    sync();
    bm.addEventListener("click", () => {
      const now = toggleBookmark(slug, title);
      sync(); toast(now ? "Pagina salvata nei segnalibri" : "Segnalibro rimosso");
    });
  }
  const marksBtn = document.getElementById("marksBtn");
  if (marksBtn) marksBtn.addEventListener("click", () => panel.open());
}
