import { actor } from "@/api/http";
import { loadShop } from "@/core/catalog";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const user = await actor();
  const shop = await loadShop(slug, user ? { role: user.role, tenantId: user.tenantId } : null);
  if (!shop) return Response.json({ error: "Laden nicht gefunden." }, { status: 404 });
  return Response.json(shop);
}
