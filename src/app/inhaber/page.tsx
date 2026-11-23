import Link from "next/link";
import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { formatEuro, formatWhen, one } from "@/ui/format";

export const metadata = { title: "Mein Laden" };

type Home = {
  name: string; slug: string; approved: boolean; industry: string;
  products: { id: string; name: string; variants: number; stock: number }[];
  orders: { number: string; when: string; email: string; method: string; goodsCents: number }[];
};

export default async function OwnerHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const shop = await apiGet<Home>("/api/v1/inhaber");
  return (
    <section className="stack">
      <h1>{shop.name}</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p>
        <span className={shop.approved ? "badge" : "badge wait"}>{shop.approved ? "Freigegeben" : "Noch nicht freigegeben"}</span>{" "}
        <span className="quiet">{shop.industry}</span>
      </p>
      {!shop.approved ? <p>Käufer sehen den Laden erst, wenn die Verwaltung ihn freigibt.</p> : null}
      <p><Link href={`/laden/${shop.slug}`}>Vorschau</Link></p>
      <h2>Sortiment</h2>
      {shop.products.length === 0 ? <p>Noch keine Produkte. Formular oder CSV, beides schreibt dieselben Daten.</p> : null}
      <div className="shop-list">
        {shop.products.map((product) => (
          <Link className="paper shop-card" key={product.id} href={`/inhaber/produkte/${product.id}`}>
            <strong>{product.name}</strong>
            <div className="meta">{product.variants} {product.variants === 1 ? "Variante" : "Varianten"} · Bestand {product.stock}</div>
          </Link>
        ))}
      </div>
      <h2>Bestellungen</h2>
      {shop.orders.length === 0 ? <p>Noch keine Bestellung.</p> : null}
      {shop.orders.map((part) => (
        <Link className="paper shop-card" key={part.number} href={`/bestellung/${part.number}`}>
          <strong>{part.number}</strong>
          <div className="meta">{formatWhen(part.when)} · {part.email} · {part.method} · Warenwert {formatEuro(part.goodsCents)}</div>
        </Link>
      ))}
    </section>
  );
}
