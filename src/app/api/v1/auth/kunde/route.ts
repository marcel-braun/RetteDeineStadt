import { readFields, reply, sessionCookie } from "@/api/http";
import { registerBuyer } from "@/core/accounts";

export async function POST(request: Request) {
  const data = await readFields(request);
  const result = await registerBuyer({
    name: String(data.get("name") ?? ""),
    email: String(data.get("email") ?? ""),
    password: String(data.get("password") ?? ""),
  });
  if (!result.ok) return reply(request, { ok: false, message: result.message, href: "/registrieren/kunde" });
  return reply(request, { ok: true, message: "Konto angelegt.", href: "/konto" }, [sessionCookie(result.user.id)]);
}
