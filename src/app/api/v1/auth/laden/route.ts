import { readFields, reply, sessionCookie } from "@/api/http";
import { registerShop } from "@/core/accounts";

export async function POST(request: Request) {
  const data = await readFields(request);
  const result = await registerShop({
    ownerName: String(data.get("ownerName") ?? ""),
    email: String(data.get("email") ?? ""),
    password: String(data.get("password") ?? ""),
    shopName: String(data.get("shopName") ?? ""),
    industryKey: String(data.get("industryKey") ?? ""),
    openingHours: String(data.get("openingHours") ?? ""),
    pickupAddress: String(data.get("pickupAddress") ?? ""),
    story: String(data.get("story") ?? ""),
  });
  if (!result.ok) return reply(request, { ok: false, message: result.message, href: "/registrieren/laden" });
  return reply(
    request,
    { ok: true, message: "Laden angemeldet. Er wird sichtbar, sobald die Verwaltung ihn freigibt.", href: "/inhaber" },
    [sessionCookie(result.user.id)],
  );
}
