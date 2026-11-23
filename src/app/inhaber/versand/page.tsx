import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { formatEuro, one } from "@/ui/format";

export const metadata = { title: "Versandwege" };

type Desk = { zones: { id: string; name: string; methods: { method: string; label: string; priceCents: number | null; checked: boolean }[] }[] };

export default async function ShippingGrantsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await apiGet<Desk>("/api/v1/inhaber/versand");
  return (
    <section className="stack">
      <h1>Versandwege</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p>Hier gibst du frei, welche Wege der Laden in einer Zone bedient. Die Preise setzt die Verwaltung. Abholung ist immer möglich und kostenlos.</p>
      <form className="stack" action="/api/v1/inhaber/versand" method="post">
        {data.zones.map((zone) => (
          <fieldset key={zone.id}>
            <legend>{zone.name}</legend>
            <div className="stack">
              {zone.methods.map((method) => (
                <label className="check" key={method.method}>
                  <input type="checkbox" name="grant" value={`${zone.id}:${method.method}`} defaultChecked={method.checked} />
                  {method.label} · {method.priceCents === null ? "noch ohne Preis" : formatEuro(method.priceCents)}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="submit">Speichern</button>
      </form>
    </section>
  );
}
