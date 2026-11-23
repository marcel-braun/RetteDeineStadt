import { cartCookie, readCartToken, readFields, reply } from "@/api/http";
import { addLine, ensureCartRecord } from "@/core/basket";

export async function POST(request: Request) {
  const data = await readFields(request);
  const cartId = await ensureCartRecord(await readCartToken());
  const result = await addLine(cartId, String(data.get("variantId") ?? ""), Number(data.get("quantity") ?? 1));
  return reply(request, result, [cartCookie(cartId)]);
}
