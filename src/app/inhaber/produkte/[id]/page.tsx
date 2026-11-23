import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { Notice } from "@/components/notice";
import { ApiError, apiGet } from "@/ui/api";
import { one } from "@/ui/format";

export const metadata = { title: "Produkt" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  let form: Parameters<typeof ProductForm>[0] & { product: { name: string } | null };
  try {
    form = await apiGet(`/api/v1/inhaber/formular?id=${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (!form.product) notFound();
  return (
    <section className="stack">
      <h1>{form.product.name}</h1>
      <Notice hinweis={one(query.hinweis)} art={one(query.art)} />
      <ProductForm industry={form.industry} product={form.product} />
    </section>
  );
}
