import { fieldMap, readFields, reply, requireActor } from "@/api/http";
import { saveShipping, shippingDesk } from "@/core/desk";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireActor("ADMIN");
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  return Response.json({ zones: await shippingDesk() });
}

export async function POST(request: Request) {
  const user = await requireActor("ADMIN");
  if (!user) return reply(request, { ok: false, message: "Bitte als Verwaltung anmelden.", href: "/anmelden?next=/admin/versand", status: 401 });
  const data = await readFields(request);
  return reply(request, await saveShipping({ newZone: String(data.get("newZone") ?? ""), fields: fieldMap(data) }));
}
