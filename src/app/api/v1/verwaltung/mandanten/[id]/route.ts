import { readFields, reply, requireActor } from "@/api/http";
import { loadTenant, updateTenant } from "@/core/desk";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireActor("ADMIN");
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await context.params;
  const tenant = await loadTenant(id);
  if (!tenant) return Response.json({ error: "Mandant nicht gefunden." }, { status: 404 });
  return Response.json(tenant);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireActor("ADMIN");
  const { id } = await context.params;
  if (!user) return reply(request, { ok: false, message: "Bitte als Verwaltung anmelden.", href: `/anmelden?next=/admin/mandanten/${id}`, status: 401 });
  const data = await readFields(request);
  return reply(
    request,
    await updateTenant({
      id,
      approved: data.get("approved") === "on" || data.get("approved") === "true",
      individual: String(data.get("individual") ?? ""),
      cadence: String(data.get("cadence") ?? ""),
      openingHours: String(data.get("openingHours") ?? ""),
      story: String(data.get("story") ?? ""),
      pickupLabel: String(data.get("pickupLabel") ?? ""),
      pickupAddress: String(data.get("pickupAddress") ?? ""),
    }),
  );
}
