import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { Notice } from "@/components/notice";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findIndustry } from "@/lib/industries/registry";
import { one } from "@/lib/text";

export const metadata = { title: "Produkt" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireRole("OWNER");
  if (!user.tenant) return <p>Kein Laden.</p>;
  const industry = findIndustry(user.tenant.industryKey);
  const product = await prisma.product.findFirst({
    where: { id, tenantId: user.tenant.id },
    include: { variants: { orderBy: { label: "asc" } } },
  });
  if (!product || !industry) notFound();
  return (
    <section className="stack">
      <h1>{product.name}</h1>
      <Notice hinweis={one(query.hinweis)} art={one(query.art)} />
      <ProductForm industry={industry} product={product} />
    </section>
  );
}
