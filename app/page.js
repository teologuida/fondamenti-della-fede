import fs from "node:fs";
import path from "node:path";
import pages from "../content/pages.json";

export default function Home() {
  const body = fs.readFileSync(
    path.join(process.cwd(), "content", "home.html"),
    "utf8"
  );
  const first = pages[0];
  return (
    <main className="book" id="content">
      <article className="page" dangerouslySetInnerHTML={{ __html: body }} />
      <nav className="pager">
        <span />
        <a className="pg next" href={`/${first.slug}/`}>
          <span>Inizia →</span>
          <b>{first.title}</b>
        </a>
      </nav>
    </main>
  );
}
