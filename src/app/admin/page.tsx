import Link from "next/link";
import { Notice } from "@/components/notice";
import { saveGlobalRate } from "@/server/admin-actions";
import { summarize } from "@/lib/commission";
import { prisma } from "@/lib/db";
import { formatEuro, formatPercent, minorToInput } from "@/lib/money";
import { one } from "@/lib/text";

export const metadata = { title: "Verwaltung" };

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [settings, tenants, parts, recent] = await Promise.all([
    prisma.platformSettings.findUnique({ where: { id: 1 } }),
    prisma.tenant.findMany({ orderBy: { name: "asc" } }),
    prisma.orderPart.findMany({ where: { order: { status: "PLACED" } }, include: { tenant: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const globalBps = settings?.globalCommissionBps ?? 0;
  const summary = summarize(
    parts.map((part) => ({
      tenantId: part.tenantId,
      tenantName: part.tenant.name,
      goodsCents: part.goodsCents,
      commissionCents: part.commissionCents,
      payoutCents: part.payoutCents,
    })),
  );
  const byTenant = new Map(summary.rows.map((row) => [row.tenantId, row]));

  return (
    <section className="stack">
      <h1>Verwaltung</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <form className="paper row" action={saveGlobalRate}>
        <label>
          Globaler Provisionssatz in Prozent
          <input name="rate" defaultValue={minorToInput(globalBps)} inputMode="decimal" />
        </label>
        <button type="submit">Satz speichern</button>
      </form>
      <p className="quiet">Warenumsatz, Provision und Auszahlung. Die Versandgebühr ist in keinem der drei Werte enthalten. Beträge stammen aus aufgenommenen Bestellungen.</p>
      <div className="paper">
        <table>
          <thead>
            <tr>
              <th>Mandant</th>
              <th>Warenumsatz</th>
              <th>Provision</th>
              <th>Auszahlung</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => {
              const row = byTenant.get(tenant.id);
              return (
                <tr key={tenant.id}>
                  <td>
                    <Link href={`/admin/mandanten/${tenant.id}`}>{tenant.name}</Link>
                  </td>
                  <td>{formatEuro(row?.goodsCents ?? 0)}</td>
                  <td>{formatEuro(row?.commissionCents ?? 0)}</td>
                  <td>{formatEuro(row?.payoutCents ?? 0)}</td>
                </tr>
              );
            })}
            <tr className="total">
              <td>Gesamt</td>
              <td>{formatEuro(summary.totals.goodsCents)}</td>
              <td>{formatEuro(summary.totals.commissionCents)}</td>
              <td>{formatEuro(summary.totals.payoutCents)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="quiet">Aktueller globaler Satz: {formatPercent(globalBps)}.</p>
      <h2>Letzte Bestellungen</h2>
      {recent.length === 0 ? <p>Noch keine Bestellung.</p> : null}
      <ul>
        {recent.map((order) => (
          <li key={order.id}>
            <Link href={`/bestellung/${order.number}`}>{order.number}</Link> · {formatEuro(order.goodsCents)} Warenwert
          </li>
        ))}
      </ul>
    </section>
  );
}
