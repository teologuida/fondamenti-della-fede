import pages from "../content/pages.json";

const BASE = "https://www.teologuida.it";

export default function sitemap() {
  const now = new Date().toISOString();
  const home = { url: `${BASE}/`, lastModified: now, changeFrequency: "monthly", priority: 1 };
  const rest = pages.map((p) => ({
    url: `${BASE}/${p.slug}/`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p.slug.startsWith("parte") ? 0.9 : 0.6
  }));
  return [home, ...rest];
}
