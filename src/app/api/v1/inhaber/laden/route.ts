import { readFields, reply, requireActor } from "@/api/http";
import { ownerProfile, saveShopProfile } from "@/core/desk";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireActor("OWNER");
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const profile = await ownerProfile(user.id);
  if (!profile) return Response.json({ error: "Kein Laden." }, { status: 404 });
  return Response.json(profile);
}

export async function POST(request: Request) {
  const user = await requireActor("OWNER");
  if (!user) return reply(request, { ok: false, message: "Bitte als Inhaber anmelden.", href: "/anmelden?next=/inhaber/laden", status: 401 });
  const data = await readFields(request);
  return reply(
    request,
    await saveShopProfile(user.id, {
      openingHours: String(data.get("openingHours") ?? ""),
      story: String(data.get("story") ?? ""),
      pickupLabel: String(data.get("pickupLabel") ?? ""),
      pickupAddress: String(data.get("pickupAddress") ?? ""),
    }),
  );
}
