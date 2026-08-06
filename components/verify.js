// Motore di verifica — lato client.
// Aggancia piccoli badge di verifica agli elementi-fonte della pagina
// (riquadri in lingua originale e tappe della cronologia) e apre un pannello
// laterale con la "scheda di verità": fonte, verificatori (AI), esame critico,
// griglia delle dimensioni e cronologia delle correzioni.
// Nessun accesso a window/document a livello di modulo (compatibile SSR).

const STATE = {
  "da-auditare":     { cls: "v-todo",  sym: "○", label: "da auditare" },
  "1-esperto":       { cls: "v-rev",   sym: "◔", label: "1 esperto" },
  "2-esperti":       { cls: "v-rev",   sym: "◑", label: "2 esperti" },
  "pronta":          { cls: "v-ready", sym: "◕", label: "pronta al sigillo" },
  "sigillata":       { cls: "v-seal",  sym: "●", label: "sigillata" },
  "non-verificabile":{ cls: "v-abst",  sym: "✕", label: "non verificabile" }
};

function slugOf() {
  const p = location.pathname.replace(/\/+$/, "");
  return p === "" ? "home" : p.split("/").pop();
}
function esc(t) {
  return String(t == null ? "" : t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function badgeHtml(sc) {
  const st = STATE[sc.stato] || STATE["pronta"];
  return '<button type="button" class="vbadge ' + st.cls + '" data-vid="' + esc(sc.id) + '" ' +
    'aria-label="Verifica: ' + esc(st.label) + '">' +
    '<span class="vb-sym" aria-hidden="true">' + st.sym + '</span>' +
    '<span class="vb-tx">verifica</span></button>';
}

// Trova l'elemento a cui agganciare il badge, secondo il "match" della scheda.
function anchorFor(root, m) {
  if (!m) return null;
  if (m.type === "oref") {
    const boxes = root.querySelectorAll(".original");
    for (const b of boxes) {
      const ref = b.querySelector(".oref");
      if (ref && ref.textContent.trim() === m.value) return b;
    }
    return null;
  }
  if (m.type === "year") {
    const evs = root.querySelectorAll(".time .ev");
    for (const e of evs) {
      const yr = e.querySelector(".yr");
      if (yr && yr.textContent.indexOf(m.value) !== -1) return e;
    }
    return null;
  }
  return null;
}

function buildPanel(byId) {
  const panel = document.createElement("aside");
  panel.className = "qa-panel v-panel"; panel.hidden = true;
  document.body.appendChild(panel);
  const scrim = document.createElement("div");
  scrim.className = "scrim v-scrim"; scrim.hidden = true;
  document.body.appendChild(scrim);
  function close() { panel.classList.remove("open"); scrim.hidden = true; setTimeout(() => (panel.hidden = true), 300); }
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });

  function open(id) {
    const c = byId[id];
    if (!c) return;
    const st = STATE[c.stato] || STATE["pronta"];
    const fonti = (c.fonti || []).map((f) => '<li>' + esc(f) + '</li>').join("");
    const griglia = (c.griglia || []).map((g) => {
      const v = g[1] === "ok" ? "ok" : (g[1] === "fix" ? "fix" : "na");
      const sym = g[1] === "ok" ? "✓" : (g[1] === "fix" ? "✗→corr" : "—");
      return '<span class="v-chip ' + v + '">' + esc(g[0]) + " " + sym + "</span>";
    }).join("");
    const av = c.esame || {};
    const hist = (c.cronologia && c.cronologia.length)
      ? '<div class="v-sec">Cronologia</div><ul class="v-hist">' +
        c.cronologia.map((h) => '<li><b>' + esc(h.v) + '</b> · ' + esc(h.t) + "</li>").join("") + "</ul>"
      : "";
    const nota = c.nota_tipo ? '<p class="v-nota"><i>' + esc(c.nota_tipo) + "</i></p>" : "";

    panel.innerHTML =
      '<div class="qp-top"><span class="qp-kick">Motore di verifica</span>' +
      '<button class="qp-close" aria-label="Chiudi">✕</button></div>' +
      '<div class="v-headline"><span class="v-state ' + st.cls + '">' + st.sym + " " + esc(st.label) + "</span>" +
        '<span class="v-type">' + esc(c.tipo || "") + "</span>" +
        '<span class="v-fid">fiducia ' + esc(c.fiducia != null ? c.fiducia : "—") + "/5</span></div>" +
      '<h2 class="qp-q v-claim">' + esc(c.testo) + "</h2>" +
      nota +
      '<div class="v-sec">Fonti</div><ul class="v-fonti">' + fonti + "</ul>" +
      '<div class="v-sec">Verificatori</div><p class="v-who">' + esc(c.verificatori) + "</p>" +
      '<div class="v-sec">Esame critico</div>' +
      '<div class="v-adv"><div class="v-q">«' + esc(av.q) + '»</div>' +
        '<div class="v-a">' + esc(av.a) + "</div>" +
        '<div class="v-verdict ' + (av.regge ? "ok" : "no") + '">' +
          (av.regge ? "✓ Regge all’esame" : "✗ Non regge all’esame") + "</div></div>" +
      '<div class="v-sec">Griglia di verifica</div><div class="v-grid">' + griglia + "</div>" +
      hist +
      '<div class="v-trust">Il sigillo finale (●) è umano: questa scheda è verificata dai revisori, ' +
        "ma resta «pronta» finché il curatore non conferma. Ciò che non si può provare lo diciamo, non lo inventiamo.</div>";
    panel.querySelector(".qp-close").addEventListener("click", close);
    panel.scrollTop = 0;
    panel.hidden = false; scrim.hidden = false;
    requestAnimationFrame(() => panel.classList.add("open"));
  }
  return { open, close };
}

export function initVerify(data) {
  const root = document.querySelector("#content .page");
  if (!root || !data || !data.pages) return;
  const page = data.pages[slugOf()];
  if (!page || !page.schede) return;

  // idempotente
  document.querySelectorAll(".v-panel, .v-scrim").forEach((e) => e.remove());
  root.querySelectorAll(".vbadge").forEach((e) => e.remove());

  const byId = Object.create(null);
  page.schede.forEach((c) => { byId[c.id] = c; });

  page.schede.forEach((c) => {
    const host = anchorFor(root, c.match);
    if (!host) return;
    if (host.querySelector(".vbadge")) return;
    host.insertAdjacentHTML("beforeend", badgeHtml(c));
  });

  const panel = buildPanel(byId);
  root.addEventListener("click", (e) => {
    const b = e.target.closest(".vbadge");
    if (b) { e.preventDefault(); panel.open(b.getAttribute("data-vid")); }
  });
}
