import { notFound } from "next/navigation";
import { Notice } from "@/components/notice";
import { ApiError, apiGet } from "@/ui/api";
import { formatEuro, one } from "@/ui/format";

export const metadata = { title: "Laden" };

type Shop = {
  name: string;
  approved: boolean;
  industry: string;
  story: string;
  openingHours: string;
  pickupLabel: string;
  pickupAddress: string;
  methods: string[];
  products: {
    id: string;
    name: string;
    description: string;
    category: string;
    axisLabel: string | null;
    facts: { label: string; text: string }[];
    variants: { id: string; label: string; priceCents: number; stock: number }[];
  }[];
};

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  let shop: Shop;
  try {
    shop = await apiGet<Shop>(`/api/v1/laeden/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <article className="stack">
      <p className="kicker">{shop.industry}</p>
      <h1>{shop.name}</h1>
      <Notice hinweis={one(query.hinweis)} art={one(query.art)} />
      {!shop.approved ? <p className="notice bad">Dieser Laden ist noch nicht freigegeben und für Käufer unsichtbar.</p> : null}
      <p className="story">{shop.story}</p>
      <div className="two">
        <section className="paper">
          <h2>Öffnungszeiten</h2>
          <p className="hours">{shop.openingHours}</p>
        </section>
        <section className="paper">
          <h2>Abholung</h2>
          <p>
            {shop.pickupLabel}
            <br />
            {shop.pickupAddress}
          </p>
          <p className="meta">Abholung ist kostenlos. Wege mit Gebühr: {shop.methods.length > 0 ? shop.methods.join(", ") : "noch keiner"}.</p>
        </section>
      </div>
      <div className="stack">
        {shop.products.map((product) => (
          <section className="paper product" key={product.id}>
            <div>
              <p className="kicker">{product.category}</p>
              <h2>{product.name}</h2>
              {product.description ? <p>{product.description}</p> : null}
              {product.axisLabel ? <p className="meta">Variante nach {product.axisLabel}</p> : null}
            </div>
            {product.facts.length > 0 ? (
              <dl className="facts">
                {product.facts.map((fact) => (
                  <span key={fact.label} style={{ display: "contents" }}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.text}</dd>
                  </span>
                ))}
              </dl>
            ) : null}
            {product.variants.map((variant) => (
              <form className="variant-row" action="/api/v1/warenkorb/hinzufuegen" method="post" key={variant.id}>
                <input type="hidden" name="variantId" value={variant.id} />
                <div>
                  <strong>{variant.label}</strong>
                  <div className="meta">
                    {formatEuro(variant.priceCents)} · {variant.stock} auf Lager
                  </div>
                </div>
                <label>
                  Menge
                  <input name="quantity" type="number" min={1} max={Math.max(variant.stock, 1)} defaultValue={1} />
                </label>
                <button type="submit" disabled={!shop.approved || variant.stock < 1}>
                  {variant.stock < 1 ? "Nicht vorrätig" : "In den Warenkorb"}
                </button>
              </form>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
