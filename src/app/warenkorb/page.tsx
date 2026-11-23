import Link from "next/link";
import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { formatEuro, one } from "@/ui/format";

export const metadata = { title: "Warenkorb" };

type Cart = {
  empty: boolean;
  zoneId?: string;
  zones?: { id: string; name: string }[];
  lines?: { variantId: string; quantity: number; stock: number }[];
  groups?: {
    tenantId: string;
    tenantName: string;
    pickupLabel: string;
    pickupAddress: string;
    goodsCents: number;
    lines: { variantId: string; productName: string; label: string; quantity: number; unitCents: number; lineCents: number }[];
  }[];
  options?: { method: string; label: string; available: boolean; priceCents: number | null }[];
  cheapest?: { label: string; priceCents: number } | null;
  goodsCents?: number;
  blocked?: boolean;
};

export default async function CartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const cart = await apiGet<Cart>("/api/v1/warenkorb");
  const lines = cart.lines ?? [];
  return (
    <section className="stack">
      <h1>Warenkorb</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      {cart.empty || !cart.groups ? (
        <p>Der Korb ist leer. <Link href="/entdecken">Läden ansehen</Link></p>
      ) : (
        <>
          {cart.groups.map((group) => (
            <section className="paper stack" key={group.tenantId}>
              <h2>{group.tenantName}</h2>
              <p className="meta">Abholung: {group.pickupLabel}, {group.pickupAddress}</p>
              {group.lines.map((line) => {
                const source = lines.find((item) => item.variantId === line.variantId);
                return (
                  <form className="variant-row" action="/api/v1/warenkorb/menge" method="post" key={line.variantId}>
                    <input type="hidden" name="variantId" value={line.variantId} />
                    <div>
                      <strong>{line.productName}</strong>
                      <div className="meta">{line.label} · {formatEuro(line.unitCents)}{source && source.quantity > source.stock ? " · mehr als auf Lager" : ""}</div>
                    </div>
                    <label>Menge<input name="quantity" type="number" min={0} defaultValue={line.quantity} /></label>
                    <div>{formatEuro(line.lineCents)}</div>
                    <button className="secondary" type="submit">Menge setzen</button>
                  </form>
                );
              })}
              <p>Warenwert dieses Ladens: {formatEuro(group.goodsCents)}</p>
            </section>
          ))}
          <section className="paper stack">
            <h2>Lieferzone und Weg</h2>
            <form className="row" action="/api/v1/warenkorb/zone" method="post">
              <input type="hidden" name="returnTo" value="/warenkorb" />
              <label>Lieferzone
                <select name="zoneId" defaultValue={cart.zoneId ?? ""}>
                  {(cart.zones ?? []).map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                </select>
              </label>
              <button className="secondary" type="submit">Zone übernehmen</button>
            </form>
            <ul>
              {(cart.options ?? []).map((option) => (
                <li key={option.method}>{option.label}: {option.available && option.priceCents !== null ? formatEuro(option.priceCents) : "nicht bei allen Läden"}</li>
              ))}
              <li>Abholung: kostenlos, je Laden am eigenen Abholort</li>
            </ul>
            <p>{cart.cheapest ? `Günstigster gemeinsamer Weg: ${cart.cheapest.label}, ${formatEuro(cart.cheapest.priceCents)}.` : "In dieser Zone haben die Läden keinen gemeinsamen Lieferweg. Abholung bleibt möglich."}</p>
            <p>Warenwert gesamt {formatEuro(cart.goodsCents ?? 0)}. Die Versandgebühr kommt einmal für die ganze Bestellung dazu.</p>
            {cart.blocked ? <p className="notice bad">Bitte die Mengen prüfen, bevor es zur Kasse geht.</p> : <Link className="button" href="/kasse">Zur Kasse</Link>}
          </section>
        </>
      )}
    </section>
  );
}
