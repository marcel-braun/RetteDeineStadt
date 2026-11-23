import Link from "next/link";

export const metadata = { title: "Marktplatz" };

export default function LandingPage() {
  return (
    <section className="landing">
      <div className="hero">
        <p className="kicker">Regionaler Marktplatz</p>
        <h1>Die Läden nebenan, in einem Korb.</h1>
        <p className="lede">
          Brot, Wurst, Eier und Sträuße aus der Pilotregion. Ein Warenkorb über mehrere Läden, Abholung oder ein gemeinsamer Lieferweg.
          Ein Konto ist freiwillig.
        </p>
        <Link className="button" href="/entdecken">
          Läden auf der Karte ansehen
        </Link>
      </div>
      <div className="paths">
        <article className="paper path">
          <p className="kicker">Für Kundinnen und Kunden</p>
          <h2>Konto anlegen</h2>
          <p>Bestellungen wiederfinden. Der Einkauf bleibt auch ohne Konto möglich, direkt als Gast.</p>
          <Link className="button" href="/registrieren/kunde">
            Als Kunde registrieren
          </Link>
        </article>
        <article className="paper path">
          <p className="kicker">Für Läden</p>
          <h2>Laden anmelden</h2>
          <p>Sortiment und Versandwege selbst pflegen. Sichtbar wird der Laden, wenn die Verwaltung ihn freigibt.</p>
          <Link className="button clay" href="/registrieren/laden">
            Als Lieferant registrieren
          </Link>
        </article>
      </div>
    </section>
  );
}
