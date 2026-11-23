import { readFields, reply, requireActor } from "@/api/http";
import { createTenant, industryChoices, listTenants } from "@/core/desk";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireActor("ADMIN");
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  return Response.json({ tenants: await listTenants(), industries: industryChoices() });
}

export async function POST(request: Request) {
  const user = await requireActor("ADMIN");
  if (!user) return reply(request, { ok: false, message: "Bitte als Verwaltung anmelden.", href: "/anmelden?next=/admin/mandanten/neu", status: 401 });
  const data = await readFields(request);
  return reply(
    request,
    await createTenant({
      name: String(data.get("name") ?? ""),
      industryKey: String(data.get("industryKey") ?? ""),
      ownerName: String(data.get("ownerName") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      openingHours: String(data.get("openingHours") ?? ""),
      pickupLabel: String(data.get("pickupLabel") ?? ""),
      pickupAddress: String(data.get("pickupAddress") ?? ""),
      story: String(data.get("story") ?? ""),
    }),
  );
}
