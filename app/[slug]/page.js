import fs from "node:fs";
import path from "node:path";
import pages from "../../content/pages.json";

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const p = pages.find((x) => x.slug === params.slug);
  return { title: (p ? p.title : "Pagina") + " — I Fondamenti della Fede" };
}

export default function Page({ params }) {
  const i = pages.findIndex((x) => x.slug === params.slug);
  const html = fs.readFileSync(
    path.join(process.cwd(), "content", params.slug + ".html"),
    "utf8"
  );
  const prev = i > 0 ? pages[i - 1] : null;
  const next = i < pages.length - 1 ? pages[i + 1] : null;
  return (
    <main className="book" id="content">
      <article className="page" dangerouslySetInnerHTML={{ __html: html }} />
      <nav className="pager">
        {prev ? (
          <a className="pg prev" href={`/${prev.slug}/`}>
            <span>← Precedente</span>
            <b>{prev.title}</b>
          </a>
        ) : (
          <a className="pg prev" href="/">
            <span>←</span>
            <b>Copertina</b>
          </a>
        )}
        {next ? (
          <a className="pg next" href={`/${next.slug}/`}>
            <span>Successivo →</span>
            <b>{next.title}</b>
          </a>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
