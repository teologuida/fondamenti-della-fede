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

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <Shell pages={pages} searchIndex={searchIndex}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
