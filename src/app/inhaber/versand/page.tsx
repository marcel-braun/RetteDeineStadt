import { Notice } from "@/components/notice";
import { saveGrants } from "@/server/owner-actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { METHOD_LABEL, PRICED_METHODS } from "@/lib/fulfillment";
import { formatEuro } from "@/lib/money";
import { one } from "@/lib/text";

export const metadata = { title: "Versandwege" };

export default async function ShippingGrantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireRole("OWNER");
  if (!user.tenant) return <p>Kein Laden.</p>;
  const [zones, grants] = await Promise.all([
    prisma.deliveryZone.findMany({ orderBy: { sort: "asc" }, include: { prices: true } }),
    prisma.tenantZoneMethod.findMany({ where: { tenantId: user.tenant.id } }),
  ]);
  return (
    <section className="stack">
      <h1>Versandwege</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p>Hier gibst du frei, welche Wege der Laden in einer Zone bedient. Die Preise setzt die Verwaltung. Abholung ist immer möglich und kostenlos.</p>
      <form className="stack" action={saveGrants}>
        {zones.map((zone) => (
          <fieldset key={zone.id}>
            <legend>{zone.name}</legend>
            <div className="stack">
              {PRICED_METHODS.map((method) => {
                const price = zone.prices.find((item) => item.method === method);
                const checked = grants.some((grant) => grant.zoneId === zone.id && grant.method === method);
                return (
                  <label className="check" key={method}>
                    <input type="checkbox" name="grant" value={`${zone.id}:${method}`} defaultChecked={checked} />
                    {METHOD_LABEL[method]} · {price ? formatEuro(price.priceCents) : "noch ohne Preis"}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
        <button type="submit">Speichern</button>
      </form>
    </section>
  );
}
