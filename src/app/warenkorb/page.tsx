import Link from "next/link";
import { Notice } from "@/components/notice";
import { chooseZone, updateLine } from "@/server/cart-actions";
import { readCartId } from "@/lib/cart-cookie";
import { METHOD_LABEL } from "@/lib/fulfillment";
import { loadCartQuote } from "@/lib/orders";
import { formatEuro } from "@/lib/money";
import { one } from "@/lib/text";

export const metadata = { title: "Warenkorb" };

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const view = await loadCartQuote(await readCartId());
  const lines = view?.lines ?? [];
  const quote = view?.quote;
  const blocked = lines.some((line) => !line.approved || line.quantity > line.stock);

  return (
    <section className="stack">
      <h1>Warenkorb</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      {lines.length === 0 || !view || !quote ? (
        <p>
          Der Korb ist leer. <Link href="/">Läden ansehen</Link>
        </p>
      ) : (
        <>
          {quote.groups.map((group) => (
            <section className="paper stack" key={group.tenantId}>
              <h2>{group.tenantName}</h2>
              <p className="meta">
                Abholung: {group.pickupLabel}, {group.pickupAddress}
              </p>
              {group.lines.map((line) => {
                const source = lines.find((item) => item.variantId === line.variantId);
                return (
                  <form className="variant-row" action={updateLine} key={line.variantId}>
                    <input type="hidden" name="variantId" value={line.variantId} />
                    <div>
                      <strong>{line.productName}</strong>
                      <div className="meta">
                        {line.label} · {formatEuro(line.unitCents)}
                        {source && source.quantity > source.stock ? " · mehr als auf Lager" : ""}
                      </div>
                    </div>
                    <label>
                      Menge
                      <input name="quantity" type="number" min={0} defaultValue={line.quantity} />
                    </label>
                    <div>{formatEuro(line.lineCents)}</div>
                    <button className="secondary" type="submit">
                      Menge setzen
                    </button>
                  </form>
                );
              })}
              <p>Warenwert dieses Ladens: {formatEuro(group.goodsCents)}</p>
            </section>
          ))}
          <section className="paper stack">
            <h2>Lieferzone und Weg</h2>
            <form className="row" action={chooseZone}>
              <input type="hidden" name="returnTo" value="/warenkorb" />
              <label>
                Lieferzone
                <select name="zoneId" defaultValue={view.zone?.id ?? ""}>
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
            {view.zone ? (
              <ul>
                {quote.options.map((option) => (
                  <li key={option.method}>
                    {METHOD_LABEL[option.method]}: {option.available && option.priceCents !== null ? formatEuro(option.priceCents) : "nicht bei allen Läden"}
                  </li>
                ))}
                <li>Abholung: kostenlos, je Laden am eigenen Abholort</li>
              </ul>
            ) : (
              <p>Es ist noch keine Lieferzone angelegt.</p>
            )}
            <p>
              {quote.cheapest
                ? `Günstigster gemeinsamer Weg: ${METHOD_LABEL[quote.cheapest.method]}, ${formatEuro(quote.cheapest.priceCents)}.`
                : "In dieser Zone haben die Läden keinen gemeinsamen Lieferweg. Abholung bleibt möglich."}
            </p>
            <p>Warenwert gesamt {formatEuro(quote.goodsCents)}. Die Versandgebühr kommt einmal für die ganze Bestellung dazu.</p>
            {blocked ? <p className="notice bad">Bitte die Mengen prüfen, bevor es zur Kasse geht.</p> : null}
            {blocked ? null : (
              <Link className="button" href="/kasse">
                Zur Kasse
              </Link>
            )}
          </section>
        </>
      )}
    </section>
  );
}
