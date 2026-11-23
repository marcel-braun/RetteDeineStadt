import { actor } from "@/api/http";
import { accountOrders } from "@/core/basket";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await actor();
  if (!user) return Response.json({ user: null, orders: [] });
  return Response.json({
    user: { name: user.name, email: user.email, role: user.role },
    orders: await accountOrders(user.id),
  });
}
