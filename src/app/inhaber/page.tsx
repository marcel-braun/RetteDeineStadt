import Link from "next/link";
import { Notice } from "@/components/notice";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { METHOD_LABEL } from "@/lib/fulfillment";
import { findIndustry } from "@/lib/industries/registry";
import { formatEuro } from "@/lib/money";
import { formatWhen, one } from "@/lib/text";

export const metadata = { title: "Mein Laden" };

export default async function OwnerHome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireRole("OWNER");
  const tenant = user.tenant;
  if (!tenant) return <p>Diesem Konto ist kein Laden zugeordnet.</p>;
  const industry = findIndustry(tenant.industryKey);
  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    include: { variants: true },
    orderBy: { name: "asc" },
  });
  const parts = await prisma.orderPart.findMany({
    where: { tenantId: tenant.id },
    include: { order: true },
    orderBy: { order: { createdAt: "desc" } },
    take: 8,
  });

  return (
    <section className="stack">
      <h1>{tenant.name}</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p>
        <span className={tenant.approved ? "badge" : "badge wait"}>{tenant.approved ? "Freigegeben" : "Noch nicht freigegeben"}</span>{" "}
        <span className="quiet">{industry?.label}</span>
      </p>
      {!tenant.approved ? <p>Käufer sehen den Laden erst, wenn die Verwaltung ihn freigibt.</p> : null}
      <p>
        <Link href={`/laden/${tenant.slug}`}>Vorschau</Link>
      </p>
      <h2>Sortiment</h2>
      {products.length === 0 ? <p>Noch keine Produkte. Formular oder CSV, beides schreibt dieselben Daten.</p> : null}
      <div className="shop-list">
        {products.map((product) => (
          <Link className="paper shop-card" key={product.id} href={`/inhaber/produkte/${product.id}`}>
            <strong>{product.name}</strong>
            <div className="meta">
              {product.variants.length} {product.variants.length === 1 ? "Variante" : "Varianten"} · Bestand{" "}
              {product.variants.reduce((sum, variant) => sum + variant.stock, 0)}
            </div>
          </Link>
        ))}
      </div>
      <h2>Bestellungen</h2>
      {parts.length === 0 ? <p>Noch keine Bestellung.</p> : null}
      {parts.map((part) => (
        <Link className="paper shop-card" key={part.id} href={`/bestellung/${part.order.number}`}>
          <strong>{part.order.number}</strong>
          <div className="meta">
            {formatWhen(part.order.createdAt)} · {part.order.email} · {METHOD_LABEL[part.order.method]} · Warenwert {formatEuro(part.goodsCents)}
          </div>
        </Link>
      ))}
    </section>
  );
}
