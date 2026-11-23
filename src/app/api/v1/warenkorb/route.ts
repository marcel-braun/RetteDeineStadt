import { readCartToken } from "@/api/http";
import { cartIdFromToken, presentCart } from "@/core/basket";

export const dynamic = "force-dynamic";

export async function GET() {
  const cartId = await cartIdFromToken(await readCartToken());
  return Response.json(await presentCart(cartId));
}
