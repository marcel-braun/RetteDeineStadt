import { notFound } from "next/navigation";
import { Notice } from "@/components/notice";
import { updateTenant } from "@/server/admin-actions";
import { prisma } from "@/lib/db";
import { findIndustry } from "@/lib/industries/registry";
import { formatPercent, minorToInput } from "@/lib/money";
import { one } from "@/lib/text";

export const metadata = { title: "Mandant" };

export default async function TenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [tenant, settings] = await Promise.all([
    prisma.tenant.findUnique({ where: { id }, include: { owner: true } }),
    prisma.platformSettings.findUnique({ where: { id: 1 } }),
  ]);
  if (!tenant) notFound();
  const globalBps = settings?.globalCommissionBps ?? 0;
  const industry = findIndustry(tenant.industryKey);
  return (
    <section className="stack">
      <p className="kicker">{industry?.label ?? tenant.industryKey}</p>
      <h1>{tenant.name}</h1>
      <Notice hinweis={one(query.hinweis)} art={one(query.art)} />
      <p className="quiet">
        Inhaber: {tenant.owner?.name ?? "—"} · {tenant.owner?.email ?? "keine E-Mail"} · Wirksamer Satz{" "}
        {formatPercent(globalBps + tenant.individualCommissionBps)}
      </p>
      <p className="quiet">
        Verbundenes Konto: {tenant.stripeAccountId ?? "noch nicht angelegt"}. Das ist der Platzhalter der vorbereiteten Schnittstelle.
      </p>
      <form className="stack" action={updateTenant}>
        <input type="hidden" name="id" value={tenant.id} />
        <label className="check">
          <input type="checkbox" name="approved" defaultChecked={tenant.approved} /> Laden freigeben
        </label>
        <div className="two">
          <label>
            Individueller Satz in Prozentpunkten
            <input name="individual" defaultValue={minorToInput(tenant.individualCommissionBps)} />
          </label>
          <label>
            Auszahlung
            <select name="cadence" defaultValue={tenant.payoutCadence}>
              <option value="WEEKLY">Wöchentlich</option>
              <option value="MONTHLY">Monatlich</option>
            </select>
          </label>
        </div>
        <div className="two">
          <label>
            Breite
            <input name="latitude" defaultValue={tenant.latitude} />
          </label>
          <label>
            Länge
            <input name="longitude" defaultValue={tenant.longitude} />
          </label>
        </div>
        <label>
          Öffnungszeiten
          <textarea name="openingHours" defaultValue={tenant.openingHours} />
        </label>
        <div className="two">
          <label>
            Abholort
            <input name="pickupLabel" defaultValue={tenant.pickupLabel} />
          </label>
          <label>
            Adresse
            <input name="pickupAddress" defaultValue={tenant.pickupAddress} />
          </label>
        </div>
        <label>
          Geschichte
          <textarea name="story" defaultValue={tenant.story} />
        </label>
        <button type="submit">Speichern</button>
      </form>
    </section>
  );
}
