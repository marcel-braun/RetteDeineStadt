import { readFields, reply, requireActor } from "@/api/http";
import { saveGlobalRate } from "@/core/desk";

export async function POST(request: Request) {
  const user = await requireActor("ADMIN");
  if (!user) return reply(request, { ok: false, message: "Bitte als Verwaltung anmelden.", href: "/anmelden?next=/admin", status: 401 });
  const data = await readFields(request);
  return reply(request, await saveGlobalRate(String(data.get("rate") ?? "")));
}
