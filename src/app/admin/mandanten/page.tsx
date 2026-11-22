import Link from "next/link";
import { prisma } from "@/lib/db";
import { findIndustry } from "@/lib/industries/registry";
import { CADENCE_LABEL } from "@/lib/labels";
import { formatPercent } from "@/lib/money";

export const metadata = { title: "Mandanten" };

export default async function TenantsPage() {
  const [tenants, settings] = await Promise.all([
    prisma.tenant.findMany({ orderBy: { name: "asc" }, include: { owner: true } }),
    prisma.platformSettings.findUnique({ where: { id: 1 } }),
  ]);
  const globalBps = settings?.globalCommissionBps ?? 0;
  return (
    <section className="stack">
      <div className="row">
        <h1>Mandanten</h1>
        <Link className="button" href="/admin/mandanten/neu">
          Neuer Mandant
        </Link>
      </div>
      <div className="paper">
        <table>
          <thead>
            <tr>
              <th>Laden</th>
              <th>Branche</th>
              <th>Status</th>
              <th>Satz</th>
              <th>Auszahlung</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>
                  <Link href={`/admin/mandanten/${tenant.id}`}>{tenant.name}</Link>
                  <div className="meta">{tenant.owner?.email}</div>
                </td>
                <td>{findIndustry(tenant.industryKey)?.label ?? tenant.industryKey}</td>
                <td>{tenant.approved ? "Freigegeben" : "Wartet"}</td>
                <td>{formatPercent(globalBps + tenant.individualCommissionBps)}</td>
                <td>{CADENCE_LABEL[tenant.payoutCadence]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
