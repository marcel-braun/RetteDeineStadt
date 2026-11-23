import type { Metadata } from "next";
import { Header } from "@/components/header";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "RetteDeineStadt", template: "%s · RetteDeineStadt" },
  description: "Regionaler Marktplatz. Ein Warenkorb über mehrere Läden.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <a className="skip" href="#inhalt">
          Zum Inhalt
        </a>
        <Header />
        <main id="inhalt" className="wrap">
          {children}
        </main>
        <footer className="site-footer">
          <div className="wrap">RetteDeineStadt · Pilotstand eines regionalen Marktplatzes.</div>
        </footer>
      </body>
    </html>
  );
}
