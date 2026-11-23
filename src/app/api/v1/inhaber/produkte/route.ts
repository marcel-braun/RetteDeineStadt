import { readFields, reply, requireActor } from "@/api/http";
import { saveProduct } from "@/core/desk";

export async function POST(request: Request) {
  const user = await requireActor("OWNER");
  if (!user) return reply(request, { ok: false, message: "Bitte als Inhaber anmelden.", href: "/anmelden?next=/inhaber", status: 401 });
  const data = await readFields(request);
  const attributes: Record<string, unknown> = {};
  for (const [key, value] of data.entries()) {
    if (!key.startsWith("attr_") || typeof value !== "string") continue;
    const name = key.slice(5);
    const current = attributes[name];
    if (current === undefined) attributes[name] = value;
    else if (Array.isArray(current)) current.push(value);
    else attributes[name] = [current, value];
  }
  const ids = data.getAll("variantId").map(String);
  const labels = data.getAll("variantLabel").map(String);
  const prices = data.getAll("variantPrice").map(String);
  const stocks = data.getAll("variantStock").map(String);
  const remove = new Set(data.getAll("variantRemove").map(String));
  const variants = labels.map((label, index) => ({
    id: ids[index] ?? "",
    label,
    price: prices[index] ?? "",
    stock: stocks[index] ?? "",
    remove: remove.has(ids[index] ?? ""),
  }));
  return reply(
    request,
    await saveProduct(user.id, {
      productId: String(data.get("productId") ?? ""),
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
      categoryKey: String(data.get("categoryKey") ?? ""),
      axis: String(data.get("axis") ?? ""),
      attributes,
      variants,
    }),
  );
}
