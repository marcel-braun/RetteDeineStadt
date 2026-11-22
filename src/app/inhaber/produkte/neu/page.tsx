import { ProductForm } from "@/components/product-form";
import { Notice } from "@/components/notice";
import { requireRole } from "@/lib/auth";
import { findIndustry } from "@/lib/industries/registry";
import { one } from "@/lib/text";

export const metadata = { title: "Neues Produkt" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireRole("OWNER");
  const industry = user.tenant ? findIndustry(user.tenant.industryKey) : null;
  if (!industry) return <p>Die Branche fehlt.</p>;
  return (
    <section className="stack">
      <h1>Neues Produkt</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <ProductForm industry={industry} />
    </section>
  );
}
