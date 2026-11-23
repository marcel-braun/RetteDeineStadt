import Link from "next/link";
import { ShopMap } from "@/components/map";
import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { formatKm, one } from "@/ui/format";

export const metadata = { title: "Läden in der Nähe" };

type Filter = { key: string; label: string; type: "text" | "boolean" | "select" | "tokens"; options: { value: string; label: string }[] };
type Discovery = {
  q: string;
  km: number;
  center: { lat: number; lng: number };
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  zoneKey: string;
  industryKey: string;
  zones: { key: string; name: string }[];
  industries: { key: string; label: string; filters: Filter[] }[];
  selection: Record<string, string>;
  shops: { slug: string; name: string; industry: string; distanceKm: number; lat: number; lng: number; methods: string[] }[];
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const text = one(value);
    if (text) query.set(key, text);
  }
  const data = await apiGet<Discovery>(`/api/v1/entdecken?${query.toString()}`);
  const industry = data.industries.find((item) => item.key === data.industryKey) ?? null;

  return (
    <section className="stack">
      <div>
        <p className="kicker">Pilotregion</p>
        <h1>Läden in der Nähe</h1>
        <p className="lede">Suche nach Laden oder Produkt. Der Umkreis und die Filter der gewählten Branche grenzen die Karte ein.</p>
      </div>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <form className="paper stack search-panel" method="get">
        <label className="search-label">
          Suche
          <input className="search-input" name="q" type="search" placeholder="Laden oder Produkt" defaultValue={data.q} />
        </label>
        <input type="hidden" name="lat" value={data.center.lat} />
        <input type="hidden" name="lng" value={data.center.lng} />
        <div className="filters">
          <label>
            Umkreis in km
            <input name="km" type="number" min={1} max={30} step={1} defaultValue={data.km} />
          </label>
          <label>
            Lieferzone
            <select name="zone" defaultValue={data.zoneKey}>
              <option value="">Keine Zone gewählt</option>
              {data.zones.map((zone) => (
                <option key={zone.key} value={zone.key}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Branche
            <select name="branche" defaultValue={data.industryKey}>
              <option value="">Alle Branchen</option>
              {data.industries.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {industry && industry.filters.length > 0 ? (
          <div className="filters">
            {industry.filters.map((filter) => (
              <label key={filter.key}>
                {filter.label}
                <select name={`f_${filter.key}`} defaultValue={data.selection[filter.key] ?? ""}>
                  <option value="">Egal</option>
                  {filter.type === "boolean" ? (
                    <>
                      <option value="ja">Ja</option>
                      <option value="nein">Nein</option>
                    </>
                  ) : (
                    filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
              </label>
            ))}
          </div>
        ) : (
          <p className="quiet">Branchenfilter erscheinen, sobald eine Branche gewählt ist.</p>
        )}
        <button type="submit">Suchen</button>
      </form>
      <div className="split">
        <ShopMap
          center={data.center}
          radiusKm={data.km}
          bounds={data.bounds}
          shops={data.shops.map((shop) => ({ slug: shop.slug, name: shop.name, lat: shop.lat, lng: shop.lng }))}
        />
        <div className="stack">
          <h2>
            {data.shops.length} {data.shops.length === 1 ? "Laden" : "Läden"} im Umkreis
          </h2>
          {data.shops.length === 0 ? <p>Nichts gefunden. Suche oder Umkreis ändern.</p> : null}
          <div className="shop-list">
            {data.shops.map((shop) => (
              <Link className="paper shop-card" key={shop.slug} href={`/laden/${shop.slug}`}>
                <p className="kicker">{shop.industry}</p>
                <h3>{shop.name}</h3>
                <p className="meta">
                  {formatKm(shop.distanceKm)} · Abholung
                  {shop.methods.map((method) => ` · ${method}`).join("")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
