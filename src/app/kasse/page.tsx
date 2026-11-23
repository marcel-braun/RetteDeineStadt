import Link from "next/link";
import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { formatEuro, one } from "@/ui/format";

export const metadata = { title: "Kasse" };

type Cart = {
  empty: boolean;
  zoneId?: string;
  zoneName?: string;
  zones?: { id: string; name: string }[];
  groups?: { tenantId: string; tenantName: string; lines: { variantId: string; productName: string; label: string; quantity: number; lineCents: number }[] }[];
  cheapest?: { method: string; label: string; priceCents: number } | null;
  goodsCents?: number;
  blocked?: boolean;
};
type Session = { user: { email: string; role: string } | null };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [cart, session] = await Promise.all([apiGet<Cart>("/api/v1/warenkorb"), apiGet<Session>("/api/v1/sitzung")]);
  const buyer = session.user?.role === "BUYER" ? session.user : null;
  const ready = !cart.empty && cart.zoneId && cart.groups && !cart.blocked;
  return (
    <section className="stack">
      <h1>Kasse</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      {!ready || !cart.groups ? (
        <p>Der Warenkorb ist noch nicht bereit. <Link href="/warenkorb">Zum Warenkorb</Link></p>
      ) : (
        <>
          {cart.groups.map((group) => (
            <section key={group.tenantId}>
              <h2>{group.tenantName}</h2>
              <ul>
                {group.lines.map((line) => (
                  <li key={line.variantId}>{line.quantity} × {line.productName} ({line.label}) · {formatEuro(line.lineCents)}</li>
                ))}
              </ul>
            </section>
          ))}
          <form className="row" action="/api/v1/warenkorb/zone" method="post">
            <input type="hidden" name="returnTo" value="/kasse" />
            <label>Lieferzone
              <select name="zoneId" defaultValue={cart.zoneId}>
                {(cart.zones ?? []).map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
              </select>
            </label>
            <button className="secondary" type="submit">Zone übernehmen</button>
          </form>
          <form className="paper stack" action="/api/v1/bestellungen" method="post">
            <input type="hidden" name="zoneId" value={cart.zoneId} />
            <fieldset>
              <legend>Weg für die ganze Bestellung</legend>
              {cart.cheapest ? (
                <label className="check">
                  <input type="radio" name="method" value={cart.cheapest.method} defaultChecked />
                  {cart.cheapest.label} · {formatEuro(cart.cheapest.priceCents)} · Gesamt {formatEuro((cart.goodsCents ?? 0) + cart.cheapest.priceCents)}
                </label>
              ) : <p>Kein gemeinsamer Lieferweg in {cart.zoneName}.</p>}
              <label className="check">
                <input type="radio" name="method" value="PICKUP" defaultChecked={!cart.cheapest} />
                Abholung · kostenlos · Gesamt {formatEuro(cart.goodsCents ?? 0)}
              </label>
            </fieldset>
            {buyer ? <p>E-Mail für diese Bestellung: <strong>{buyer.email}</strong></p> : (
              <label>E-Mail<input name="email" type="email" required autoComplete="email" /></label>
            )}
            <p className="quiet">Ein Konto ist nicht nötig. Die Plattform würde den Gesamtbetrag kassieren und je Laden den Warenwert abzüglich Provision auszahlen. In diesem Stand merkt die vorbereitete Stripe-Connect-Schnittstelle die Zahlung nur vor. Es wird nichts abgebucht.</p>
            <button type="submit">Zahlung vormerken</button>
          </form>
        </>
      )}
    </section>
  );
}
