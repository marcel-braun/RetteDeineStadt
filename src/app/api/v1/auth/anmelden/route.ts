import { readFields, reply, sessionCookie } from "@/api/http";
import { authenticate } from "@/core/accounts";
import { safeNext } from "@/core/text";

export async function POST(request: Request) {
  const data = await readFields(request);
  const next = safeNext(String(data.get("next") ?? ""));
  const user = await authenticate(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
  if (!user) {
    const back = `/anmelden?next=${encodeURIComponent(next)}`;
    return reply(request, { ok: false, message: "E-Mail oder Passwort stimmt nicht.", href: back });
  }
  const href = next !== "/" ? next : user.role === "ADMIN" ? "/admin" : user.role === "OWNER" ? "/inhaber" : "/konto";
  return reply(request, { ok: true, message: "Angemeldet.", href, extra: { role: user.role } }, [sessionCookie(user.id)]);
}
