import Link from "next/link";
import { ShopMap } from "@/components/map";
import { Notice } from "@/components/notice";
import { prisma } from "@/lib/db";
import { distanceKm } from "@/lib/geo";
import { METHOD_LABEL, visibleInZone, type PricedMethod } from "@/lib/fulfillment";
import { findIndustry } from "@/lib/industries/registry";
import { readAttributes } from "@/lib/industries/types";
import { formatKm } from "@/lib/money";
import { DEFAULT_RADIUS_KM, PILOT_CENTER } from "@/lib/region";
import { one } from "@/lib/text";

export const metadata = { title: "Läden in der Nähe" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const km = clamp(Number(one(params.km)), DEFAULT_RADIUS_KM);
  const lat = numberOr(one(params.lat), PILOT_CENTER.lat);
  const lng = numberOr(one(params.lng), PILOT_CENTER.lng);
  const zoneKey = one(params.zone) || "";
  const industryKey = one(params.branche) || "";
  const industry = industryKey ? findIndustry(industryKey) : null;
  const selection: Record<string, string> = {};
  if (industry) {
    for (const filter of industry.filters) {
      const value = one(params[`f_${filter.key}`]);
      if (value) selection[filter.key] = value;
    }
  }

  const [shops, zones, industries] = await Promise.all([
    prisma.tenant.findMany({
      where: { approved: true },
      include: { zoneMethods: true, products: true },
      orderBy: { name: "asc" },
    }),
    prisma.deliveryZone.findMany({ orderBy: { sort: "asc" } }),
    prisma.tenant.findMany({ where: { approved: true }, distinct: ["industryKey"], select: { industryKey: true } }),
  ]);
  const zone = zones.find((item) => item.key === zoneKey) ?? null;
  const visible = shops
    .map((shop) => ({ shop, distance: distanceKm({ lat, lng }, { lat: shop.latitude, lng: shop.longitude }) }))
    .filter(({ shop, distance }) => {
      if (distance > km) return false;
      if (!visibleInZone(shop.zoneMethods, zone?.id ?? null)) return false;
      if (industry && shop.industryKey !== industry.key) return false;
      if (industry && Object.keys(selection).length > 0) {
        return shop.products.some((product) => industry.matches(readAttributes(product.attributes), selection));
      }
      return true;
    })
    .sort((a, b) => a.distance - b.distance);

  const presentIndustries = industries
    .map((item) => findIndustry(item.industryKey))
    .filter((item) => item !== null);

  return (
    <section className="stack">
      <div>
        <p className="kicker">Pilotregion</p>
        <h1>Läden in der Nähe</h1>
        <p className="lede">Ein Warenkorb, auch wenn die Waren aus mehreren Läden kommen. Sichtbar sind nur freigegebene Läden.</p>
      </div>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <form className="paper stack" method="get" key={`${lat}-${lng}-${km}-${zoneKey}-${industry?.key ?? ""}`}>
        <div className="filters">
          <label>
            Umkreis in km
            <input name="km" type="number" min={1} max={30} step={1} defaultValue={km} />
          </label>
          <label>
            Breite
            <input name="lat" type="number" step="0.0001" defaultValue={lat} />
          </label>
          <label>
            Länge
            <input name="lng" type="number" step="0.0001" defaultValue={lng} />
          </label>
          <label>
            Lieferzone
            <select name="zone" defaultValue={zoneKey}>
              <option value="">Keine Zone gewählt</option>
              {zones.map((item) => (
                <option key={item.id} value={item.key}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="two">
          <label>
            Branche
            <select name="branche" defaultValue={industry?.key ?? ""}>
              <option value="">Alle Branchen</option>
              {presentIndustries.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="stack">
            {industry && industry.filters.length > 0 ? (
              <>
                <span className="quiet">Filter dieser Branche</span>
                {industry.filters.map((filter) => {
                  const field = industry.fields.find((item) => item.key === filter.key);
                  if (field?.type === "select") {
                    return (
                      <label key={filter.key}>
                        {filter.label}
                        <select name={`f_${filter.key}`} defaultValue={selection[filter.key] ?? ""}>
                          <option value="">Egal</option>
                          {(field.options ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  return (
                    <label key={filter.key}>
                      {filter.label}
                      <select name={`f_${filter.key}`} defaultValue={selection[filter.key] ?? ""}>
                        <option value="">Egal</option>
                        <option value="ja">Ja</option>
                        <option value="nein">Nein</option>
                      </select>
                    </label>
                  );
                })}
              </>
            ) : (
              <p className="quiet">Branchenfilter erscheinen, sobald eine Branche gewählt ist, die Filter mitbringt.</p>
            )}
          </div>
        </div>
        <button type="submit">Anzeigen</button>
      </form>
      <div className="split">
        <ShopMap
          center={{ lat, lng }}
          radiusKm={km}
          shops={visible.map(({ shop }) => ({ slug: shop.slug, name: shop.name, lat: shop.latitude, lng: shop.longitude }))}
        />
        <div className="stack">
          <h2>
            {visible.length} {visible.length === 1 ? "Laden" : "Läden"} im Umkreis
          </h2>
          {visible.length === 0 ? <p>In diesem Umkreis liegt kein freigegebener Laden.</p> : null}
          <div className="shop-list">
            {visible.map(({ shop, distance }) => {
              const branch = findIndustry(shop.industryKey);
              const methods = new Set(shop.zoneMethods.map((grant) => grant.method as PricedMethod));
              return (
                <Link className="paper shop-card" key={shop.id} href={`/laden/${shop.slug}`}>
                  <p className="kicker">{branch?.label ?? shop.industryKey}</p>
                  <h3>{shop.name}</h3>
                  <p className="meta">
                    {formatKm(distance)} · Abholung
                    {[...methods].map((method) => ` · ${METHOD_LABEL[method]}`).join("")}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function clamp(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(30, Math.max(1, value));
}

function numberOr(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
