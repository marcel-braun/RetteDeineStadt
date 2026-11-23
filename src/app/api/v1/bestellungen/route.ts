import { actor, knownOrderTokens, orderCookie, readCartToken, readFields, reply } from "@/api/http";
import { cartIdFromToken, checkoutCart } from "@/core/basket";

export async function POST(request: Request) {
  const cartId = await cartIdFromToken(await readCartToken());
  if (!cartId) return reply(request, { ok: false, message: "Der Warenkorb ist leer.", href: "/warenkorb" });
  const user = await actor();
  const data = await readFields(request);
  const email = user?.role === "BUYER" ? user.email : String(data.get("email") ?? "");
  const result = await checkoutCart({
    cartId,
    email,
    zoneId: String(data.get("zoneId") ?? ""),
    method: String(data.get("method") ?? ""),
    userId: user?.id ?? null,
  });
  if (!result.ok) return reply(request, result);
  const tokens = await knownOrderTokens();
  return reply(request, { ...result, extra: { number: result.number, accessToken: result.accessToken } }, [
    orderCookie(tokens, result.accessToken),
  ]);
}
