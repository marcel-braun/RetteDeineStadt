import { ProductForm } from "@/components/product-form";
import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { one } from "@/ui/format";

export const metadata = { title: "Neues Produkt" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const form = await apiGet<{ industry: Parameters<typeof ProductForm>[0]["industry"] }>("/api/v1/inhaber/formular");
  return (
    <section className="stack">
      <h1>Neues Produkt</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <ProductForm industry={form.industry} />
    </section>
  );
}
