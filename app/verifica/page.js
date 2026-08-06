import verification from "../../content/verification.json";

export const metadata = {
  title: "Motore di verifica",
  description:
    "Ogni affermazione verificabile del manuale, riga per riga: fonte primaria, revisori indipendenti, esame critico e stato di verifica. Numeri calcolati dai dati, sigillo finale umano.",
  alternates: { canonical: "/verifica/" }
};

const STATE = {
  "da-auditare": { cls: "v-todo", sym: "○", label: "da auditare" },
  "1-esperto": { cls: "v-rev", sym: "◔", label: "1 esperto" },
  "2-esperti": { cls: "v-rev", sym: "◑", label: "2 esperti" },
  "pronta": { cls: "v-ready", sym: "◕", label: "pronta al sigillo" },
  "sigillata": { cls: "v-seal", sym: "●", label: "sigillata" },
  "non-verificabile": { cls: "v-abst", sym: "✕", label: "non verificabile" }
};

function allSchede() {
  const out = [];
  const pages = verification.pages || {};
  Object.keys(pages).forEach((slug) => {
    (pages[slug].schede || []).forEach((s) => out.push({ ...s, _page: pages[slug], _slug: slug }));
  });
  return out;
}

function Chip({ g }) {
  const v = g[1] === "ok" ? "ok" : g[1] === "fix" ? "fix" : "na";
  const sym = g[1] === "ok" ? "✓" : g[1] === "fix" ? "✗→corr" : "—";
  return <span className={"v-chip " + v}>{g[0]} {sym}</span>;
}

function Card({ s }) {
  const st = STATE[s.stato] || STATE.pronta;
  const av = s.esame || {};
  return (
    <div className="v-card">
      <div className="v-card-top">
        <span className={"v-state " + st.cls}>{st.sym} {st.label}</span>
        <span className="v-type">{s.tipo}</span>
        <span className="v-fid">fiducia {s.fiducia != null ? s.fiducia : "—"}/5</span>
        <p className="v-claim">{s.testo}</p>
      </div>
      <div className="v-card-body">
        {s.nota_tipo ? <p className="v-nota"><i>{s.nota_tipo}</i></p> : null}
        <div className="v-row"><div className="v-lab">Fonti</div>
          <ul className="v-fonti">{(s.fonti || []).map((f, i) => <li key={i}>{f}</li>)}</ul></div>
        <div className="v-row"><div className="v-lab">Verificatori</div>
          <div className="v-who">{s.verificatori}</div></div>
        <div className="v-row"><div className="v-lab">Esame critico</div>
          <div>
            <div className="v-adv">
              <div className="v-q">«{av.q}»</div>
              <div className="v-a">{av.a}</div>
            </div>
            <div className={"v-verdict " + (av.regge ? "ok" : "no")}>
              {av.regge ? "✓ Regge all’esame" : "✗ Non regge all’esame"}
            </div>
          </div></div>
        <div className="v-row"><div className="v-lab">Griglia</div>
          <div className="v-grid">{(s.griglia || []).map((g, i) => <Chip key={i} g={g} />)}</div></div>
        {s.cronologia && s.cronologia.length ? (
          <div className="v-row"><div className="v-lab">Cronologia</div>
            <ul className="v-hist">{s.cronologia.map((h, i) => <li key={i}><b>{h.v}</b> · {h.t}</li>)}</ul></div>
        ) : null}
      </div>
    </div>
  );
}

export default function VerificaPage() {
  const schede = allSchede();
  const n = schede.length;
  const ready = schede.filter((s) => s.stato === "pronta").length;
  const sealed = schede.filter((s) => s.stato === "sigillata").length;
  const abst = schede.filter((s) => s.stato === "non-verificabile").length;
  const corr = schede.filter((s) => s.cronologia && s.cronologia.length).length;
  const pct = (x) => (n ? Math.round((x / n) * 100) : 0);

  // raggruppa per pagina, poi per sezione
  const pages = verification.pages || {};
  const pageSlugs = Object.keys(pages);

  return (
    <main className="book" id="content">
      <article className="page">
        <section className="sheet" id="verifica">
          <div className="col">
            <div className="rhead"><span>Apparato</span><span className="folio">Motore di verifica</span></div>
            <div className="chap-open">
              <div className="chap-num">Controllo scientifico · dai dati</div>
              <h1 className="chap-title">Il motore di verifica</h1>
              <p className="chap-lede">Ogni affermazione, riga per riga: la sua fonte, chi l'ha controllata, l'obiezione più forte che ha superato. I numeri qui sotto si contano da soli. Il sigillo finale è umano.</p>
            </div>

            <p className="opening rv">Non ti chiediamo di fidarti: ti mostriamo il lavoro. I revisori sono <strong>esperti AI indipendenti</strong> che verificano alla fonte primaria, con un <strong>esame critico</strong> che tenta di confutare ogni frase. Ciò che non si può provare resta visibile come «non verificabile» — mai nascosto. Nulla è «sigillato» ● finché il curatore umano non conferma.</p>

            <div className="v-dash rv">
              <div className="v-kpi"><div className="v-n">{n}</div><div className="v-k">affermazioni verificate</div></div>
              <div className="v-kpi r"><div className="v-n">{ready}</div><div className="v-k">◕ pronte al sigillo</div></div>
              <div className="v-kpi s"><div className="v-n">{sealed}</div><div className="v-k">● sigillate</div></div>
              <div className="v-kpi a"><div className="v-n">{abst}</div><div className="v-k">✕ non verificabili</div></div>
            </div>
            <div className="v-bar rv" role="img" aria-label={`${ready} pronte, ${sealed} sigillate, ${abst} non verificabili`}>
              <i className="ir" style={{ width: pct(ready) + "%" }} />
              <i className="is" style={{ width: pct(sealed) + "%" }} />
              <i className="ia" style={{ width: pct(abst) + "%" }} />
            </div>
            <p className="rv small" style={{ color: "var(--ink-3)" }}>
              {ready} di {n} pronte · 0 sigillate (in attesa della conferma umana) · {corr} con correzione tracciata nel <a href="/registro-modifiche">Registro</a>.
            </p>

            {pageSlugs.map((slug) => {
              const pg = pages[slug];
              const secs = {};
              const order = [];
              (pg.schede || []).forEach((s) => {
                if (!secs[s.sezione]) { secs[s.sezione] = []; order.push(s.sezione); }
                secs[s.sezione].push(s);
              });
              return (
                <div key={slug}>
                  <div className="shead"><span className="k">Pagina</span><span className="t">{pg.titolo}</span></div>
                  {pg.nota ? <p className="rv small" style={{ color: "var(--ink-3)" }}>{pg.nota}</p> : null}
                  {order.map((sec) => (
                    <div key={sec} className="rv">
                      <div className="v-sechead">Sezione {sec}</div>
                      {secs[sec].map((s) => <Card key={s.id} s={s} />)}
                    </div>
                  ))}
                </div>
              );
            })}

            <p className="rv small" style={{ color: "var(--ink-3)", marginTop: "2em" }}>
              Le altre pagine seguiranno, una alla volta, con lo stesso metodo: due revisori indipendenti, un esame critico e la conferma umana per il sigillo.
            </p>
          </div>
        </section>

        <nav className="pager">
          <a className="pg prev" href="/audit"><span>← Apparato</span><b>Audit di verifica</b></a>
          <a className="pg next" href="/registro-modifiche"><span>Successivo →</span><b>Registro delle modifiche</b></a>
        </nav>
      </article>
    </main>
  );
}
