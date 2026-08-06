"use client";
import { useEffect } from "react";
import { initStudy } from "./study";
import glossary from "../content/glossary.json";
import bussolaCards from "../content/bussola-cards.json";

export default function Shell({ pages, searchIndex, children }) {
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const root = document.documentElement;
    const $ = (id) => document.getElementById(id);

    // progress
    const prog = $("progress");
    const onScroll = () => {
      const max = root.scrollHeight - root.clientHeight;
      if (prog) prog.style.width = (max > 0 ? (root.scrollTop / max) * 100 : 0) + "%";
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    onScroll();

    // reveal
    const rs = document.querySelectorAll(".rv");
    if (reduce || !("IntersectionObserver" in window)) {
      rs.forEach((e) => e.classList.add("in"));
    } else {
      const io = new IntersectionObserver(
        (en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
        { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
      );
      rs.forEach((e) => io.observe(e));
    }

    // theme (persistente)
    try { const st = localStorage.getItem("fdf-theme"); if (st) root.setAttribute("data-theme", st); } catch (e) {}
    const onTheme = () => {
      let c = root.getAttribute("data-theme");
      if (!c) c = matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
      c = c === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", c);
      try { localStorage.setItem("fdf-theme", c); } catch (e) {}
    };
    $("themeBtn")?.addEventListener("click", onTheme);

    // font size (persistente)
    const STEPS = [0.85, 0.92, 1, 1.1, 1.22, 1.35, 1.5];
    let idx = 2;
    try { const s = localStorage.getItem("fdf-fs"); if (s !== null) { const n = parseInt(s, 10); if (!isNaN(n)) idx = Math.max(0, Math.min(STEPS.length - 1, n)); } } catch (e) {}
    const applyFs = () => { root.style.fontSize = STEPS[idx] * 100 + "%"; try { localStorage.setItem("fdf-fs", idx); } catch (e) {} onScroll(); };
    applyFs();
    $("fsMinus")?.addEventListener("click", () => { if (idx > 0) { idx--; applyFs(); } });
    $("fsPlus")?.addEventListener("click", () => { if (idx < STEPS.length - 1) { idx++; applyFs(); } });

    // note "ⓘ"
    const onInfo = (e) => {
      const b = e.target.closest ? e.target.closest(".info > .i") : null;
      if (!b) return;
      const info = b.parentNode;
      const open = info.classList.toggle("open");
      b.setAttribute("aria-expanded", open ? "true" : "false");
    };
    document.addEventListener("click", onInfo);

    // drawer
    const drawer = $("drawer"), scrim = $("scrim");
    const openDrawer = (o) => { if (!drawer) return; drawer.classList.toggle("open", o); if (scrim) scrim.hidden = !o; drawer.setAttribute("aria-hidden", o ? "false" : "true"); };
    $("menuBtn")?.addEventListener("click", () => openDrawer(!drawer.classList.contains("open")));
    scrim?.addEventListener("click", () => openDrawer(false));

    // condividi
    const toast = (msg) => {
      const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
      document.body.appendChild(t); requestAnimationFrame(() => t.classList.add("show"));
      setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 250); }, 1800);
    };
    $("shareBtn")?.addEventListener("click", () => {
      const url = location.href, data = { title: document.title, url };
      if (navigator.share) navigator.share(data).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("Link copiato negli appunti")).catch(() => toast(url));
      else toast(url);
    });

    // ricerca
    const ov = $("searchOverlay"), inp = $("searchInput"), res = $("searchResults");
    const openSearch = (o) => { if (!ov) return; ov.hidden = !o; if (o) setTimeout(() => inp && inp.focus(), 30); };
    $("searchBtn")?.addEventListener("click", () => openSearch(true));
    $("searchClose")?.addEventListener("click", () => openSearch(false));
    ov?.addEventListener("click", (e) => { if (e.target === ov) openSearch(false); });
    const onKey = (e) => {
      if (e.key === "Escape") openSearch(false);
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && ov && ov.hidden) { e.preventDefault(); openSearch(true); }
    };
    document.addEventListener("keydown", onKey);
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const run = (q) => {
      q = q.toLowerCase().trim();
      if (!q) { res.innerHTML = ""; return; }
      const terms = q.split(/\s+/);
      const hits = (searchIndex || []).map((p) => {
        const hay = (p.title + " " + p.text).toLowerCase();
        let sc = 0; terms.forEach((t) => { const k = hay.split(t).length - 1; if (k > 0) sc += k; });
        if (!sc) return null;
        const pos = p.text.toLowerCase().indexOf(terms[0]);
        let snip = pos >= 0 ? p.text.slice(Math.max(0, pos - 45), pos + 90) : p.text.slice(0, 130);
        snip = esc(snip);
        terms.forEach((t) => { snip = snip.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
        return { p, sc, snip };
      }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 12);
      if (!hits.length) { res.innerHTML = '<div class="sr-empty">Nessun risultato per «' + esc(q) + "».</div>"; return; }
      res.innerHTML = hits.map((h) => '<a href="/' + h.p.slug + (h.p.slug ? "/" : "") + '"><div class="sr-t">' + esc(h.p.title) + '</div><div class="sr-s">…' + h.snip + "…</div></a>").join("");
    };
    inp?.addEventListener("input", () => run(inp.value));

    // funzioni di studio: evidenzia, glossario, condividi paragrafo, segnalibri
    try { initStudy(glossary, bussolaCards); } catch (e) {}

    // PWA: registra il service worker per la lettura offline
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      document.removeEventListener("click", onInfo);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchIndex]);

  return (
    <>
      <a className="skip-link" href="#content">Salta al contenuto</a>
      <div className="progress" id="progress" />
      <header className="site">
        <a className="brand" href="/"><img className="brand-logo" src="/icon-192.png" alt="Teologuida" width="26" height="26" /> I Fondamenti della Fede</a>
        <div className="site-tools">
          <button id="menuBtn" className="hbtn" aria-label="Indice">☰ <span className="lbl">Indice</span></button>
          <button id="searchBtn" className="hbtn" aria-label="Cerca">⌕ <span className="lbl">Cerca</span></button>
          <div className="fsgroup">
            <button id="fsMinus" aria-label="Riduci testo">A−</button>
            <button id="fsPlus" aria-label="Ingrandisci testo">A+</button>
          </div>
          <button id="themeBtn" className="hbtn" aria-label="Tema">◐</button>
          <button id="bookmarkBtn" className="hbtn star" aria-label="Salva nei segnalibri">★</button>
          <button id="marksBtn" className="hbtn" aria-label="I miei segni">✎ <span className="lbl">Segni</span></button>
          <button id="shareBtn" className="hbtn" aria-label="Condividi">↗ <span className="lbl">Condividi</span></button>
          <a className="hbtn pdf" href="/Fondamenti_della_Fede.pdf" download>⤓ PDF</a>
        </div>
      </header>
      <nav className="drawer" id="drawer" aria-hidden="true">
        <div className="drawer-head">Indice del manuale</div>
        {pages.map((p) => (
          <a key={p.slug} href={`/${p.slug}/`}>{p.nav}</a>
        ))}
      </nav>
      <div className="scrim" id="scrim" hidden />

      {children}

      <footer className="site-foot">
        <a href="https://www.teologuida.it" className="foot-brand" aria-label="Teologuida">
          <img className="foot-logo light" src="/logo-teologuida.png" alt="Teologuida" />
          <img className="foot-logo dark" src="/teologuida-bianca.png" alt="Teologuida" />
        </a>
        <div className="foot-txt">
          <strong>I Fondamenti della Fede</strong> — manuale del discepolo · documento vivo, verificabile.
          <br />
          Ogni affermazione va controllata alla luce della Scrittura · <em>Sola Scriptura</em>
          <br />
          Trovato un errore? <a href="mailto:info@teologuida.it?subject=Segnalazione%20errore%20%E2%80%94%20Teologuida">Segnalacelo</a> — non abbiamo nulla da nascondere.
          <br />
          © Teologuida · <a href="https://www.teologuida.it">teologuida.it</a>
        </div>
      </footer>

      <div className="search-overlay" id="searchOverlay" hidden>
        <div className="search-box">
          <input type="search" id="searchInput" placeholder="Cerca nel manuale… (es. giustificazione, manoscritti, Trinità)" autoComplete="off" />
          <button id="searchClose" aria-label="Chiudi">✕</button>
          <div className="search-results" id="searchResults" />
        </div>
      </div>
    </>
  );
}
