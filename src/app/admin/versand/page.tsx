import { Notice } from "@/components/notice";
import { saveShipping } from "@/server/admin-actions";
import { prisma } from "@/lib/db";
import { METHOD_LABEL, PRICED_METHODS } from "@/lib/fulfillment";
import { minorToInput } from "@/lib/money";
import { one } from "@/lib/text";

export const metadata = { title: "Versandpreise" };

export default async function ShippingAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const zones = await prisma.deliveryZone.findMany({ orderBy: { sort: "asc" }, include: { prices: true } });
  return (
    <section className="stack">
      <h1>Lieferzonen und Preise</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p>Ein fester Preis je Zone und Versandweg. Abholung hat keinen Preis. Ein leeres Feld entfernt den Preis, der Weg wird dann nicht angeboten.</p>
      <form className="stack" action={saveShipping}>
        {zones.map((zone) => (
          <fieldset key={zone.id}>
            <legend>Zone</legend>
            <label>
              Name
              <input name={`name:${zone.id}`} defaultValue={zone.name} />
            </label>
            <div className="filters">
              {PRICED_METHODS.map((method) => {
                const price = zone.prices.find((item) => item.method === method);
                return (
                  <label key={method}>
                    {METHOD_LABEL[method]} in Euro
                    <input name={`price:${zone.id}:${method}`} defaultValue={price ? minorToInput(price.priceCents) : ""} inputMode="decimal" />
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
        <label>
          Neue Zone
          <input name="newZone" placeholder="Name der Zone" />
        </label>
        <button type="submit">Speichern</button>
      </form>
    </section>
  );
}
