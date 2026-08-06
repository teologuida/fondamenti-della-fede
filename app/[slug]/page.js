import fs from "node:fs";
import path from "node:path";
import pages from "../../content/pages.json";
import faqData from "../../content/faq.json";

const BASE = "https://www.teologuida.it";

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const p = pages.find((x) => x.slug === params.slug);
  const title = p ? p.title : "Pagina";
  return {
    title,
    alternates: { canonical: `/${params.slug}/` },
    openGraph: { type: "article", title }
  };
}

export default function Page({ params }) {
  const i = pages.findIndex((x) => x.slug === params.slug);
  const p = pages[i] || { title: "Pagina" };
  const html = fs.readFileSync(
    path.join(process.cwd(), "content", params.slug + ".html"),
    "utf8"
  );
  const prev = i > 0 ? pages[i - 1] : null;
  const next = i < pages.length - 1 ? pages[i + 1] : null;

  const url = `${BASE}/${params.slug}/`;
  const graph = [
    {
      "@type": "Article",
      "@id": url + "#article",
      headline: p.title,
      inLanguage: "it",
      isPartOf: { "@id": BASE + "/#book" },
      author: { "@id": BASE + "/#org" },
      publisher: { "@id": BASE + "/#org" },
      mainEntityOfPage: url
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE + "/" },
        { "@type": "ListItem", position: 2, name: p.title, item: url }
      ]
    }
  ];
  const faqs = faqData[params.slug];
  if (faqs && faqs.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
    });
  }
  const pageLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <main className="book" id="content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }}
      />
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
