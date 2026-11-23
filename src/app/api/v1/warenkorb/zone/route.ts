import { cartCookie, readCartToken, readFields, reply } from "@/api/http";
import { ensureCartRecord, setZone } from "@/core/basket";
import { safeNext } from "@/core/text";

export async function POST(request: Request) {
  const data = await readFields(request);
  const cartId = await ensureCartRecord(await readCartToken());
  const result = await setZone(cartId, String(data.get("zoneId") ?? ""), safeNext(String(data.get("returnTo") ?? "/warenkorb")));
  return reply(request, result, [cartCookie(cartId)]);
}
