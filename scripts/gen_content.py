#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera i contenuti del sito Next.js dalla fonte unica ../Fondamenti_della_Fede.html
Output:  content/<slug>.html, content/home.html, content/pages.json,
         content/search-index.json, app/globals.css
Esegui da web/:   python3 scripts/gen_content.py   (o: npm run content)
"""
import os, re, json, html as _html

HERE = os.path.dirname(os.path.abspath(__file__))
WEB  = os.path.dirname(HERE)
SRC  = os.path.join(WEB, "..", "Fondamenti_della_Fede.html")
CONTENT = os.path.join(WEB, "content")
APPDIR  = os.path.join(WEB, "app")
os.makedirs(CONTENT, exist_ok=True); os.makedirs(APPDIR, exist_ok=True)

if not os.path.exists(SRC):
    # Su Vercel (o in un clone senza la sorgente) usiamo i contenuti già generati e committati.
    print("Sorgente non trovata: uso i contenuti gia' presenti in content/.")
    raise SystemExit(0)

src = open(SRC, encoding="utf-8").read()
style = re.search(r"<style>(.*?)</style>", src, re.S).group(1)
sections = {m.group(2): m.group(3).strip()
            for m in re.finditer(r'<section class="[^"]*" id="([^"]*)">|', src)  # placeholder
            } if False else {}
sections = {}
for m in re.finditer(r'<section class="([^"]*)" id="([^"]*)">(.*?)</section>', src, re.S):
    sections[m.group(2)] = '<section class="%s" id="%s">%s</section>' % (m.group(1), m.group(2), m.group(3))
epi = re.search(r'<section class="epigraph">.*?</section>', src, re.S)
EPIGRAPH = epi.group(0) if epi else ""

PAGES = [
    ("prefazione","Prefazione","Prefazione · Nota sul metodo","prefazione"),
    ("perche-fidarsi","Perché fidarsi","Perché fidarsi di questo documento","__PERCHE__"),
    ("introduzione","Introduzione","Introduzione · La necessità della sana dottrina","intro"),
    ("parte-1-la-parola","Parte I · La Parola","Parte I · La Parola di Dio e la sua affidabilità","parte1"),
    ("parte-2-dio-e-la-trinita","Parte II · Dio e la Trinità","Parte II · Dio, la Trinità e i concili","parte2"),
    ("parte-3-la-salvezza-in-cristo","Parte III · La salvezza in Cristo","Parte III · La salvezza in Cristo","parte3"),
    ("parte-4-la-chiesa","Parte IV · La Chiesa","Parte IV · La Chiesa: il popolo di Dio","parte4"),
    ("parte-5-apologetica","Parte V · Apologetica","Parte V · Riconoscere gli inganni","parte5"),
    ("i-tuoi-primi-passi","I tuoi primi passi","I tuoi primi passi","primi-passi"),
    ("conclusione","Conclusione","Conclusione · Soli Deo Gloria","fine"),
    ("cronologia","Cronologia storica","Cronologia storica essenziale","cronologia"),
    ("registro-modifiche","Registro modifiche","Registro delle modifiche","registro"),
    ("audit","Audit di verifica","Audit di verifica","audit"),
    ("fonti","Fonti","Fonti e ricerche citate","fonti"),
]

PERCHE = """
  <section class="sheet" id="perche-fidarsi">
    <div class="col">
      <div class="rhead"><span>Il metodo</span><span class="folio">Perché fidarsi</span></div>
      <div class="chap-open">
        <div class="chap-num">Per lo scettico e per chi cerca</div>
        <h1 class="chap-title">Perché fidarsi di questo documento</h1>
        <p class="chap-lede">Non ti chiediamo di credere sulla parola. Ti chiediamo di controllare.</p>
      </div>
      <p class="opening rv">Forse non hai fede, o l'hai persa, o non hai mai aperto una Bibbia. Bene: questo documento è costruito proprio per essere <strong>controllabile</strong>, per quanto possibile, da chiunque — credente o no. Non poggia sull'autorità di chi scrive, ma su fatti che puoi ricontrollare tu stesso.</p>
      <div class="shead"><span class="k">Principio 1</span><span class="t">Ogni affermazione ha una fonte</span></div>
      <p class="rv">Dove vedi un piccolo <strong>ⓘ</strong>, cliccalo: si apre la fonte esatta — un versetto, un manoscritto, uno studio, con il link per andare a controllare. Le affermazioni importanti rimandano alla loro fonte.</p>
      <div class="shead"><span class="k">Principio 2</span><span class="t">Fonti primarie e testi originali</span></div>
      <p class="rv">Dove possibile citiamo l'originale (ebraico, greco, latino) e l'edizione critica, non un riassunto di seconda mano. Puoi vedere <em>esattamente</em> cosa dice il testo, non solo cosa qualcuno afferma che dica.</p>
      <div class="shead"><span class="k">Principio 3</span><span class="t">Onestà sui dubbi</span></div>
      <p class="rv">Quando gli studiosi discutono — per esempio sulla datazione di un antico frammento — <strong>lo diciamo apertamente</strong>, invece di nasconderlo. Un documento che nasconde i dubbi non merita fiducia.</p>
      <div class="shead"><span class="k">Principio 4</span><span class="t">Distinguiamo i piani</span></div>
      <p class="rv">Separiamo, con costanza, ciò che è <em>fatto storico</em> (una data, un manoscritto), ciò che è <em>interpretazione</em> e ciò che è <em>fede</em>. Non spacciamo l'uno per l'altro.</p>
      <div class="callout rv">
        <div class="h">Come verificare tu stesso</div>
        <p>1) Apri le note ⓘ e segui i link alle fonti. 2) Confronta con la Bibbia (i riferimenti sono sempre indicati). 3) Se trovi un errore, si corregge: ogni modifica è tracciata nel <a href="/registro-modifiche">Registro delle modifiche</a>. La verità non teme il controllo.</p>
      </div>
    </div>
  </section>
"""

def strip_tags(s):
    s = re.sub(r"<[^>]+>", " ", s); s = _html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()

# --- scrittura fragment per pagina + indice ricerca + estrazione Q&A (schema FAQ)
index_docs = []
faq = {}
qa_re = re.compile(r'class="qa-q"[^>]*>(.*?)<span class="lbl">.*?</button>\s*<div class="qa-a">(.*?)</div>', re.S)
for slug, nav, title, sid in PAGES:
    frag = PERCHE if sid == "__PERCHE__" else sections.get(sid, "")
    open(os.path.join(CONTENT, slug + ".html"), "w", encoding="utf-8").write(frag)
    index_docs.append({"slug": slug, "title": title, "nav": nav, "text": strip_tags(frag)[:4000]})
    qas = [{"q": strip_tags(m.group(1)), "a": strip_tags(m.group(2))} for m in qa_re.finditer(frag)]
    if qas:
        faq[slug] = qas
open(os.path.join(CONTENT, "faq.json"), "w", encoding="utf-8").write(
    json.dumps(faq, ensure_ascii=False, indent=1))

# --- home
def home_cards():
    out = []
    for slug, nav, title, sid in PAGES:
        if slug in ("registro-modifiche", "audit"): continue
        out.append('<a class="tcard" href="/%s"><span class="tc-k">%s</span><span class="tc-t">%s</span></a>'
                   % (slug, _html.escape(nav), _html.escape(title)))
    return "\n".join(out)

HOME = sections["top"] + EPIGRAPH + """
  <section class="sheet" id="home-intro">
    <div class="col">
      <div class="chap-open">
        <div class="chap-num">Un documento vivo</div>
        <h2 class="chap-title">Studia il Vangelo con fatti che puoi verificare</h2>
        <p class="chap-lede">Un manuale per chi inizia — e per chi dubita. Ogni affermazione ha la sua fonte, aperta e controllabile.</p>
      </div>
      <p class="opening rv">Questo non è solo un libro: è un sistema che cresce nel tempo. Puoi leggerlo dal telefono, aprire le fonti con un tocco, cercare qualsiasi argomento e scaricare tutto in PDF. È pensato per chi non conosce la Bibbia e per chi vuole prove prima di credere.</p>
      <p class="rv"><a class="cta" href="/prefazione">Inizia da qui →</a> &nbsp; <a class="cta ghost" href="/perche-fidarsi">Perché fidarsi</a></p>
      <div class="tgrid rv">__CARDS__</div>
    </div>
  </section>
""".replace("__CARDS__", home_cards())
open(os.path.join(CONTENT, "home.html"), "w", encoding="utf-8").write(HOME)
index_docs.insert(0, {"slug": "", "title": "Copertina", "nav": "Home", "text": strip_tags(HOME)[:1500]})

open(os.path.join(CONTENT, "pages.json"), "w", encoding="utf-8").write(
    json.dumps([{"slug": s, "nav": n, "title": t} for s, n, t, _ in PAGES], ensure_ascii=False, indent=2))
open(os.path.join(CONTENT, "search-index.json"), "w", encoding="utf-8").write(
    json.dumps(index_docs, ensure_ascii=False))

# --- schede Bussola (JSON per pannello laterale sulle Parti)
bussola_frag = sections.get("bussola", "")
bussola_cards = []
for m in re.finditer(
    r'<div class="doc rv" id="([^"]+)">\s*'
    r'<button[^>]*>.*?<span class="doc-cat ([^"]+)">([^<]+)</span>'
    r'.*?<span class="gauge (l\d)">(.*?)</span>'
    r'<span class="doc-lv">([^<]+)</span>.*?'
    r'<span class="doc-q">([^<]+)</span></button>\s*'
    r'<div class="doc-body">(.*?)</div>\s*</div>',
    bussola_frag, re.S):
    cid, cat_cls, cat, gauge, gauge_html, lv, title, body = m.groups()
    bussola_cards.append({
        "id": cid,
        "catClass": cat_cls,
        "cat": cat,
        "gauge": gauge,
        "gaugeHtml": '<span class="gauge %s">%s</span>' % (gauge, gauge_html),
        "level": lv,
        "title": title,
        "body": body.strip(),
    })
open(os.path.join(CONTENT, "bussola-cards.json"), "w", encoding="utf-8").write(
    json.dumps(bussola_cards, ensure_ascii=False, indent=2))

# Niente pagina Bussola sul sito: solo schede JSON per il pannello laterale
_old_bx = os.path.join(CONTENT, "bussola-delle-dottrine.html")
if os.path.exists(_old_bx):
    os.remove(_old_bx)

# --- globals.css = design system + stili del sito
APP_CSS_EXTRA = open(os.path.join(HERE, "site.css"), encoding="utf-8").read() if os.path.exists(os.path.join(HERE,"site.css")) else ""
open(os.path.join(APPDIR, "globals.css"), "w", encoding="utf-8").write(style + "\n" + APP_CSS_EXTRA)

print("Contenuti Next generati:", len(PAGES), "pagine + home | ricerca:", len(index_docs), "voci | bussola:", len(bussola_cards), "schede (solo pannello)")
