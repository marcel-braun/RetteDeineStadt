import { requireActor } from "@/api/http";
import { ownerHome } from "@/core/desk";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireActor("OWNER");
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const home = await ownerHome(user.id);
  if (!home) return Response.json({ error: "Kein Laden." }, { status: 404 });
  return Response.json(home);
}
