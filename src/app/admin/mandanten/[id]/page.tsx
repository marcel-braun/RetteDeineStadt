import { notFound } from "next/navigation";
import { Notice } from "@/components/notice";
import { ApiError, apiGet } from "@/ui/api";
import { one } from "@/ui/format";

export const metadata = { title: "Mandant" };

type Tenant = {
  id: string; name: string; industry: string; ownerName: string; ownerEmail: string; approved: boolean;
  individualInput: string; cadence: string; rateLabel: string; stripeAccountId: string | null;
  openingHours: string; pickupLabel: string; pickupAddress: string; story: string;
};

export default async function TenantPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  let tenant: Tenant;
  try {
    tenant = await apiGet<Tenant>(`/api/v1/verwaltung/mandanten/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <section className="stack">
      <p className="kicker">{tenant.industry}</p>
      <h1>{tenant.name}</h1>
      <Notice hinweis={one(query.hinweis)} art={one(query.art)} />
      <p className="quiet">Inhaber: {tenant.ownerName || "—"} · {tenant.ownerEmail || "keine E-Mail"} · Wirksamer Satz {tenant.rateLabel}</p>
      <p className="quiet">Verbundenes Konto: {tenant.stripeAccountId ?? "noch nicht angelegt"}. Das ist der Platzhalter der vorbereiteten Schnittstelle.</p>
      <form className="stack" action={`/api/v1/verwaltung/mandanten/${tenant.id}`} method="post">
        <label className="check"><input type="checkbox" name="approved" defaultChecked={tenant.approved} /> Laden freigeben</label>
        <div className="two">
          <label>Individueller Satz in Prozentpunkten<input name="individual" defaultValue={tenant.individualInput} /></label>
          <label>Auszahlung
            <select name="cadence" defaultValue={tenant.cadence}>
              <option value="WEEKLY">Wöchentlich</option>
              <option value="MONTHLY">Monatlich</option>
            </select>
          </label>
        </div>
        <label>Öffnungszeiten<textarea name="openingHours" defaultValue={tenant.openingHours} /></label>
        <div className="two">
          <label>Abholort<input name="pickupLabel" defaultValue={tenant.pickupLabel} /></label>
          <label>Adresse<input name="pickupAddress" defaultValue={tenant.pickupAddress} /></label>
        </div>
        <label>Geschichte<textarea name="story" defaultValue={tenant.story} /></label>
        <button type="submit">Speichern</button>
      </form>
    </section>
  );
}
