import { actor, knownOrderTokens } from "@/api/http";
import { presentOrder } from "@/core/basket";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ nummer: string }> }) {
  const { nummer } = await context.params;
  const user = await actor();
  const order = await presentOrder(nummer, {
    userId: user?.id ?? null,
    role: user?.role ?? null,
    tenantId: user?.tenantId ?? null,
    tokens: await knownOrderTokens(),
    queryToken: new URL(request.url).searchParams.get("zugang") ?? "",
  });
  if (!order) return Response.json({ error: "Bestellung nicht gefunden." }, { status: 404 });
  if (order.forbidden) return Response.json({ error: "Kein Zugriff." }, { status: 404 });
  return Response.json(order);
}
