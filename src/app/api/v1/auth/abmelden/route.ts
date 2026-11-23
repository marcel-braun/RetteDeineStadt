import { clearSessionCookie, reply } from "@/api/http";

export async function POST(request: Request) {
  return reply(request, { ok: true, message: "Abgemeldet.", href: "/" }, [clearSessionCookie()]);
}
