import Link from "next/link";
import { apiGet } from "@/ui/api";

export const metadata = { title: "Mandanten" };

type Payload = { tenants: { id: string; name: string; email: string; industry: string; approved: boolean; rateLabel: string; cadence: string }[] };

export default async function TenantsPage() {
  const data = await apiGet<Payload>("/api/v1/verwaltung/mandanten");
  return (
    <section className="stack">
      <div className="row">
        <h1>Mandanten</h1>
        <Link className="button" href="/admin/mandanten/neu">Neuer Mandant</Link>
      </div>
      <div className="paper">
        <table>
          <thead><tr><th>Laden</th><th>Branche</th><th>Status</th><th>Satz</th><th>Auszahlung</th></tr></thead>
          <tbody>
            {data.tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td><Link href={`/admin/mandanten/${tenant.id}`}>{tenant.name}</Link><div className="meta">{tenant.email}</div></td>
                <td>{tenant.industry}</td>
                <td>{tenant.approved ? "Freigegeben" : "Wartet"}</td>
                <td>{tenant.rateLabel}</td>
                <td>{tenant.cadence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
