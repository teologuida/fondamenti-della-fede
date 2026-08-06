import "./globals.css";
import Shell from "../components/Shell";
import pages from "../content/pages.json";
import searchIndex from "../content/search-index.json";

export const metadata = {
  metadataBase: new URL("https://www.teologuida.it"),
  title: {
    default: "I Fondamenti della Fede — Teologuida",
    template: "%s · Teologuida"
  },
  description:
    "Manuale di discepolato cristiano per principianti e scettici: ogni affermazione documentata, testi originali, download PDF. Un documento vivo e verificabile, di Teologuida.",
  applicationName: "Teologuida",
  authors: [{ name: "Teologuida" }],
  creator: "Teologuida",
  publisher: "Teologuida",
  keywords: [
    "teologia riformata", "discepolato cristiano", "vangelo", "Bibbia",
    "sana dottrina", "apologetica", "Trinità", "giustificazione", "Teologuida"
  ],
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    siteName: "Teologuida",
    locale: "it_IT",
    url: "https://www.teologuida.it",
    title: "I Fondamenti della Fede — Teologuida",
    description: "Il Vangelo con fonti verificabili — un manuale vivo e documentato.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "I Fondamenti della Fede — Teologuida" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "I Fondamenti della Fede — Teologuida",
    description: "Il Vangelo con fonti verificabili.",
    images: ["/og.png"]
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1b19"
};

const ORG_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.teologuida.it/#org",
      "name": "Teologuida",
      "url": "https://www.teologuida.it",
      "logo": "https://www.teologuida.it/icon-512.png"
    },
    {
      "@type": "WebSite",
      "@id": "https://www.teologuida.it/#website",
      "name": "Teologuida — I Fondamenti della Fede",
      "url": "https://www.teologuida.it",
      "inLanguage": "it",
      "publisher": { "@id": "https://www.teologuida.it/#org" }
    },
    {
      "@type": "Book",
      "@id": "https://www.teologuida.it/#book",
      "name": "I Fondamenti della Fede",
      "inLanguage": "it",
      "author": { "@id": "https://www.teologuida.it/#org" },
      "publisher": { "@id": "https://www.teologuida.it/#org" },
      "about": "Discepolato cristiano e teologia riformata, con fonti verificabili"
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }}
        />
        <Shell pages={pages} searchIndex={searchIndex}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
