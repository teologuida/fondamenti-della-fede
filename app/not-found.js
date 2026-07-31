export const metadata = { title: "Pagina non trovata" };

export default function NotFound() {
  return (
    <main className="book" id="content">
      <section className="sheet" style={{ textAlign: "center" }}>
        <div className="col">
          <div className="chap-open">
            <div className="chap-num">Errore 404</div>
            <h2 className="chap-title">Questa pagina non esiste</h2>
            <p className="chap-lede">
              Forse il link è datato, oppure la pagina è stata spostata durante un
              riordino del manuale. Nulla è perduto: riparti da qui.
            </p>
          </div>
          <p style={{ textAlign: "center", marginTop: "1.5em" }}>
            <a className="cta" href="/">Torna alla copertina</a>
            &nbsp;&nbsp;
            <a className="cta ghost" href="/introduzione/">Vai all'introduzione</a>
          </p>
        </div>
      </section>
    </main>
  );
}
