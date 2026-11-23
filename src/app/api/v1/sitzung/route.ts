import { actor, readCartToken } from "@/api/http";
import { cartCount } from "@/core/basket";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await actor();
  const count = await cartCount(await readCartToken());
  return Response.json({
    user: user ? { name: user.name, email: user.email, role: user.role } : null,
    cartCount: count,
  });
}
