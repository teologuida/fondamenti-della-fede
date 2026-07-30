import "./globals.css";
import Shell from "../components/Shell";
import pages from "../content/pages.json";
import searchIndex from "../content/search-index.json";

export const metadata = {
  title: "I Fondamenti della Fede — Manuale del discepolo",
  description:
    "Manuale di discepolato cristiano per principianti e scettici: ogni affermazione documentata, testi originali, download PDF. Un documento vivo e verificabile.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "I Fondamenti della Fede",
    description: "Il Vangelo con fonti verificabili — un documento vivo.",
    type: "website"
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
