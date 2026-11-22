import Link from "next/link";
import { Notice } from "@/components/notice";
import { checkout, chooseZone } from "@/server/cart-actions";
import { currentUser } from "@/lib/auth";
import { readCartId } from "@/lib/cart-cookie";
import { METHOD_LABEL } from "@/lib/fulfillment";
import { loadCartQuote } from "@/lib/orders";
import { formatEuro } from "@/lib/money";
import { one } from "@/lib/text";

export const metadata = { title: "Kasse" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await currentUser();
  const view = await loadCartQuote(await readCartId());
  const quote = view?.quote;
  const lines = view?.lines ?? [];
  const blocked = !view || !quote || lines.length === 0 || lines.some((line) => !line.approved || line.quantity > line.stock);
  const buyer = user?.role === "BUYER" ? user : null;

  return (
    <section className="stack">
      <h1>Kasse</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      {blocked || !view || !quote || !view.zone ? (
        <p>
          Der Warenkorb ist noch nicht bereit. <Link href="/warenkorb">Zum Warenkorb</Link>
        </p>
      ) : (
        <>
          {quote.groups.map((group) => (
            <section key={group.tenantId}>
              <h2>{group.tenantName}</h2>
              <ul>
                {group.lines.map((line) => (
                  <li key={line.variantId}>
                    {line.quantity} × {line.productName} ({line.label}) · {formatEuro(line.lineCents)}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <form className="row" action={chooseZone}>
            <input type="hidden" name="returnTo" value="/kasse" />
            <label>
              Lieferzone
              <select name="zoneId" defaultValue={view.zone.id}>
                {view.zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="secondary" type="submit">
              Zone übernehmen
            </button>
          </form>
          <form className="paper stack" action={checkout}>
            <input type="hidden" name="zoneId" value={view.zone.id} />
            <fieldset>
              <legend>Weg für die ganze Bestellung</legend>
              {quote.cheapest ? (
                <label className="check">
                  <input type="radio" name="method" value={quote.cheapest.method} defaultChecked />
                  {METHOD_LABEL[quote.cheapest.method]} · {formatEuro(quote.cheapest.priceCents)} · Gesamt {formatEuro(quote.goodsCents + quote.cheapest.priceCents)}
                </label>
              ) : (
                <p>Kein gemeinsamer Lieferweg in {view.zone.name}.</p>
              )}
              <label className="check">
                <input type="radio" name="method" value="PICKUP" defaultChecked={!quote.cheapest} />
                Abholung · kostenlos · Gesamt {formatEuro(quote.goodsCents)}
              </label>
            </fieldset>
            {buyer ? (
              <p>
                E-Mail für diese Bestellung: <strong>{buyer.email}</strong>
              </p>
            ) : (
              <label>
                E-Mail
                <input name="email" type="email" required autoComplete="email" />
              </label>
            )}
            <p className="quiet">
              Ein Konto ist nicht nötig. Die Plattform würde den Gesamtbetrag kassieren und je Laden den Warenwert abzüglich Provision auszahlen.
              In diesem Stand merkt die vorbereitete Stripe-Connect-Schnittstelle die Zahlung nur vor. Es wird nichts abgebucht.
            </p>
            <button type="submit">Zahlung vormerken</button>
          </form>
        </>
      )}
    </section>
  );
}
