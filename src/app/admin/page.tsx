import Link from "next/link";
import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { formatEuro, one } from "@/ui/format";

export const metadata = { title: "Verwaltung" };

type Overview = {
  rateInput: string;
  rateLabel: string;
  tenants: { id: string; name: string; goodsCents: number; commissionCents: number; payoutCents: number }[];
  totals: { goodsCents: number; commissionCents: number; payoutCents: number };
  recent: { number: string; goodsCents: number }[];
};

export default async function AdminHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await apiGet<Overview>("/api/v1/verwaltung");
  return (
    <section className="stack">
      <h1>Verwaltung</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <form className="paper row" action="/api/v1/verwaltung/satz" method="post">
        <label>Globaler Provisionssatz in Prozent<input name="rate" defaultValue={data.rateInput} inputMode="decimal" /></label>
        <button type="submit">Satz speichern</button>
      </form>
      <p className="quiet">Warenumsatz, Provision und Auszahlung. Die Versandgebühr ist in keinem der drei Werte enthalten.</p>
      <div className="paper">
        <table>
          <thead><tr><th>Mandant</th><th>Warenumsatz</th><th>Provision</th><th>Auszahlung</th></tr></thead>
          <tbody>
            {data.tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td><Link href={`/admin/mandanten/${tenant.id}`}>{tenant.name}</Link></td>
                <td>{formatEuro(tenant.goodsCents)}</td>
                <td>{formatEuro(tenant.commissionCents)}</td>
                <td>{formatEuro(tenant.payoutCents)}</td>
              </tr>
            ))}
            <tr className="total">
              <td>Gesamt</td>
              <td>{formatEuro(data.totals.goodsCents)}</td>
              <td>{formatEuro(data.totals.commissionCents)}</td>
              <td>{formatEuro(data.totals.payoutCents)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="quiet">Aktueller globaler Satz: {data.rateLabel}.</p>
      <h2>Letzte Bestellungen</h2>
      {data.recent.length === 0 ? <p>Noch keine Bestellung.</p> : null}
      <ul>
        {data.recent.map((order) => (
          <li key={order.number}><Link href={`/bestellung/${order.number}`}>{order.number}</Link> · {formatEuro(order.goodsCents)} Warenwert</li>
        ))}
      </ul>
    </section>
  );
}
