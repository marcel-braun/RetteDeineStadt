import { readCartToken, readFields, reply } from "@/api/http";
import { cartIdFromToken, setLine } from "@/core/basket";

export async function POST(request: Request) {
  const cartId = await cartIdFromToken(await readCartToken());
  if (!cartId) return reply(request, { ok: false, message: "Der Warenkorb ist leer.", href: "/warenkorb" });
  const data = await readFields(request);
  const result = await setLine(cartId, String(data.get("variantId") ?? ""), Number(data.get("quantity") ?? 0));
  return reply(request, result);
}
