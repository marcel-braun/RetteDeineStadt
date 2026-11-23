import { readFields, reply, requireActor } from "@/api/http";
import { ownerGrants, saveGrants } from "@/core/desk";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireActor("OWNER");
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const zones = await ownerGrants(user.id);
  if (!zones) return Response.json({ error: "Kein Laden." }, { status: 404 });
  return Response.json({ zones });
}

export async function POST(request: Request) {
  const user = await requireActor("OWNER");
  if (!user) return reply(request, { ok: false, message: "Bitte als Inhaber anmelden.", href: "/anmelden?next=/inhaber/versand", status: 401 });
  const data = await readFields(request);
  return reply(request, await saveGrants(user.id, data.getAll("grant").map(String)));
}
