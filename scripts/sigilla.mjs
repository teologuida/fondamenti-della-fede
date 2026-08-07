#!/usr/bin/env node
// Strumento del curatore: appone (o verifica) il sigillo ● sulle affermazioni.
//
// Uso:
//   npm run sigilla -- <pagina|id|tutte>     appone il sigillo alle schede "pronte"
//   npm run sigilla -- --check               elenca i sigilli rotti (testo cambiato)
//   npm run sigilla -- --stato               riassunto degli stati
//
// Esempi:
//   npm run sigilla -- parte-2-dio-e-la-trinita
//   npm run sigilla -- p2-gv1-1
//   npm run sigilla -- tutte
//
// Il sigillo è la firma del CURATORE UMANO. Appone { hash, data, da } dove hash
// è l'impronta dell'esatto testo verificato: se poi il testo cambia, il sigillo
// si rompe da solo (stato "rotta") e la scheda va ri-verificata.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashText, effectiveState } from "../components/seal-util.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, "..", "content", "verification.json");

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const pages = data.pages || {};
const arg = process.argv[2];
const oggi = new Date().toISOString().slice(0, 10);

function allSchede() {
  const out = [];
  for (const [slug, pg] of Object.entries(pages)) {
    for (const s of (pg.schede || [])) out.push({ slug, s });
  }
  return out;
}

if (!arg || arg === "--help") {
  console.log("Uso: npm run sigilla -- <pagina|id|tutte>  |  --check  |  --stato");
  process.exit(0);
}

if (arg === "--stato" || arg === "--check") {
  let pronte = 0, sigillate = 0, rotte = 0, altro = 0;
  const rotteList = [];
  for (const { slug, s } of allSchede()) {
    const eff = effectiveState(s);
    if (eff === "pronta") pronte++;
    else if (eff === "sigillata") sigillate++;
    else if (eff === "rotta") { rotte++; rotteList.push(`${slug} · ${s.id}`); }
    else altro++;
  }
  console.log(`Stati: ● sigillate ${sigillate} · ◕ pronte ${pronte} · ⚠ rotte ${rotte} · altro ${altro}`);
  if (rotteList.length) {
    console.log("\nSIGILLI ROTTI (il testo è cambiato dopo il sigillo — ri-auditare):");
    rotteList.forEach((r) => console.log("  ⚠ " + r));
  }
  process.exit(0);
}

// selezione bersaglio
const targets = allSchede().filter(({ slug, s }) =>
  arg === "tutte" || slug === arg || s.id === arg
);

if (!targets.length) {
  console.error(`Nessuna scheda trovata per «${arg}». Usa una pagina (es. parte-2-dio-e-la-trinita), un id (es. p2-gv1-1), o «tutte».`);
  process.exit(1);
}

let sigillate = 0, saltate = 0;
for (const { s } of targets) {
  const eff = effectiveState(s);
  if (eff === "sigillata") { saltate++; continue; } // già sigillata e integra
  if (s.stato !== "pronta") { saltate++; continue; } // solo le "pronte" sono sigillabili
  s.sigillo = { hash: hashText(s.testo), data: oggi, da: "curatore" };
  if (!s.cronologia) s.cronologia = [];
  s.cronologia.push({ v: "sigillo", t: `sigillata dal curatore il ${oggi} (impronta ${s.sigillo.hash})` });
  sigillate++;
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`● Sigillate: ${sigillate} · saltate (non pronte o già sigillate): ${saltate}. Ricorda: 'npm run content' + commit per pubblicare.`);
