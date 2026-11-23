import { requireActor } from "@/api/http";
import { adminOverview } from "@/core/desk";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireActor("ADMIN");
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  return Response.json(await adminOverview());
}
