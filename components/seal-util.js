// Sigillo del curatore + impronta del testo.
// Una scheda "sigillata" porta un sigillo { hash, data, da }. Il sigillo è
// legato all'ESATTO testo verificato: se il testo cambia, l'impronta non
// corrisponde più e lo stato effettivo diventa "rotta" (⚠) — il sigillo si
// rompe da solo, senza che nessuno debba ricordarsene.
//
// La stessa funzione è usata sia in fase di build (app/verifica), sia lato
// client (components/verify.js), sia dallo script del curatore (scripts/sigilla.mjs),
// così l'impronta è identica ovunque.

export function hashText(t) {
  const s = String(t == null ? "" : t).normalize("NFC").replace(/\s+/g, " ").trim();
  let h = 0x811c9dc5; // FNV-1a a 32 bit
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// Stato "effettivo" tenendo conto del sigillo e dell'impronta.
export function effectiveState(scheda) {
  const sig = scheda && scheda.sigillo;
  if (sig && sig.hash) {
    return sig.hash === hashText(scheda.testo) ? "sigillata" : "rotta";
  }
  return scheda.stato;
}
