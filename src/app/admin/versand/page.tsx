import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { one } from "@/ui/format";

export const metadata = { title: "Versandpreise" };

type Desk = { zones: { id: string; name: string; prices: { method: string; label: string; input: string }[] }[] };

export default async function ShippingAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await apiGet<Desk>("/api/v1/verwaltung/versand");
  return (
    <section className="stack">
      <h1>Lieferzonen und Preise</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p>Ein fester Preis je Zone und Versandweg. Abholung hat keinen Preis. Ein leeres Feld entfernt den Preis, der Weg wird dann nicht angeboten.</p>
      <form className="stack" action="/api/v1/verwaltung/versand" method="post">
        {data.zones.map((zone) => (
          <fieldset key={zone.id}>
            <legend>Zone</legend>
            <label>Name<input name={`name:${zone.id}`} defaultValue={zone.name} /></label>
            <div className="filters">
              {zone.prices.map((price) => (
                <label key={price.method}>{price.label} in Euro<input name={`price:${zone.id}:${price.method}`} defaultValue={price.input} inputMode="decimal" /></label>
              ))}
            </div>
          </fieldset>
        ))}
        <label>Neue Zone<input name="newZone" placeholder="Name der Zone" /></label>
        <button type="submit">Speichern</button>
      </form>
    </section>
  );
}
