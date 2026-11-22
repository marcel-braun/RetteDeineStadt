import { notFound } from "next/navigation";
import { Notice } from "@/components/notice";
import { addToCart } from "@/server/cart-actions";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { METHOD_LABEL, type PricedMethod } from "@/lib/fulfillment";
import { findIndustry } from "@/lib/industries/registry";
import { readAttributes } from "@/lib/industries/types";
import { formatEuro } from "@/lib/money";
import { one } from "@/lib/text";

export const metadata = { title: "Laden" };

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const shop = await prisma.tenant.findUnique({
    where: { slug },
    include: { products: { include: { variants: { orderBy: { label: "asc" } } }, orderBy: { name: "asc" } }, zoneMethods: true },
  });
  if (!shop) notFound();
  const user = await currentUser();
  const canPreview = user?.role === "ADMIN" || user?.tenantId === shop.id;
  if (!shop.approved && !canPreview) notFound();
  const industry = findIndustry(shop.industryKey);
  const methods = [...new Set(shop.zoneMethods.map((grant) => METHOD_LABEL[grant.method as PricedMethod]))];

  return (
    <article className="stack">
      <p className="kicker">{industry?.label ?? shop.industryKey}</p>
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
          <p className="meta">Abholung ist kostenlos. Wege mit Gebühr: {methods.length > 0 ? methods.join(", ") : "noch keiner"}.</p>
        </section>
      </div>
      <div className="stack">
        {shop.products.map((product) => {
          const attributes = readAttributes(product.attributes);
          return (
            <section className="paper product" key={product.id}>
              <div>
                <p className="kicker">{industry?.categoryLabel(product.categoryKey) ?? product.categoryKey}</p>
                <h2>{product.name}</h2>
                {product.description ? <p>{product.description}</p> : null}
                {product.axisLabel ? <p className="meta">Variante nach {product.axisLabel}</p> : null}
              </div>
              {industry ? (
                <dl className="facts">
                  {industry.fields.map((field) => {
                    const value = attributes[field.key];
                    if (value === undefined) return null;
                    const text =
                      typeof value === "boolean"
                        ? value
                          ? "Ja"
                          : "Nein"
                        : field.type === "select"
                          ? (field.options?.find((option) => option.value === value)?.label ?? value)
                          : value;
                    return (
                      <span key={field.key} style={{ display: "contents" }}>
                        <dt>{field.label}</dt>
                        <dd>{text}</dd>
                      </span>
                    );
                  })}
                </dl>
              ) : null}
              {product.variants.map((variant) => (
                <form className="variant-row" action={addToCart} key={variant.id}>
                  <input type="hidden" name="variantId" value={variant.id} />
                  <div>
                    <strong>{variant.label}</strong>
                    <div className="meta">{formatEuro(variant.priceCents)} · {variant.stock} auf Lager</div>
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
          );
        })}
      </div>
    </article>
  );
}
