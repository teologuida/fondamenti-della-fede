# I Fondamenti della Fede — sito (Next.js)

Manuale di discepolato cristiano, **verificabile e vivo**. Costruito con Next.js
(App Router, export statico) → pronto per **Vercel** e, in futuro, per diventare una **PWA**.

## Come funziona
- **Fonte unica dei contenuti:** `../Fondamenti_della_Fede.html` (lo stesso file che genera il PDF).
- Lo script `scripts/gen_content.py` estrae ogni sezione in `content/*.html`, crea
  `content/pages.json`, l'indice di ricerca `content/search-index.json` e `app/globals.css`.
- Next legge quei contenuti e genera una pagina statica per ogni capitolo.
- Aggiungere/aggiornare un capitolo = modificare la fonte, poi `npm run content`.

## Avvio in locale
```bash
cd web
npm install
npm run dev        # http://localhost:3000  (esegue prima gen_content.py)
```
Richiede **Node 18+** e **Python 3** (per lo script dei contenuti).

## Build statica
```bash
npm run build      # genera ./out con tutte le pagine statiche
```

## Pubblicare su Vercel
1. Metti questa cartella `web/` in un repository Git (GitHub/GitLab).
2. Su **vercel.com** → *New Project* → importa il repo.
3. Framework: **Next.js** (rilevato in automatico). Deploy. Fatto: avrai un URL pubblico.
   - Se Vercel non trova Python per `gen_content.py`, esegui `npm run content` in locale
     e committa la cartella `content/` (già inclusa), così il build non dipende da Python.

## Diventare una PWA (passo futuro, già predisposto)
- `public/manifest.webmanifest` e le icone sono già presenti (installabile su telefono).
- Passo successivo: aggiungere un **service worker** per la lettura **offline**
  (es. libreria `next-pwa`, oppure un SW manuale registrato dal client). Lasciato per
  la prossima tappa per mantenere la build semplice e robusta.

## Funzioni già incluse
Tema chiaro/scuro · dimensione testo · note espandibili «ⓘ» · indice a scomparsa ·
ricerca full-text · condividi · download PDF · navigazione precedente/successivo.

## In arrivo
Evidenziazioni & segnalibri · glossario tap-to-define · condivisione del paragrafo esatto ·
service worker (offline/PWA) · nuove Parti del manuale.
