import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { reply, requireActor, wantsJson } from "@/api/http";
import { csvTemplate, importOwnerCsv } from "@/core/desk";
import { withNotice } from "@/core/text";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireActor("OWNER");
  if (!user?.tenant) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const template = csvTemplate(user.tenant.industryKey);
  if (!template) return Response.json({ error: "Branche fehlt." }, { status: 404 });
  const raw = (await cookies()).get("rds_import")?.value;
  return Response.json({ label: template.label, columns: template.columns, example: template.example, report: parseReport(raw) });
}

export async function POST(request: Request) {
  const user = await requireActor("OWNER");
  if (!user) return reply(request, { ok: false, message: "Bitte als Inhaber anmelden.", href: "/anmelden?next=/inhaber/import", status: 401 });
  const data = await request.formData();
  const file = data.get("datei");
  if (!(file instanceof File) || file.size === 0) return reply(request, { ok: false, message: "Bitte eine CSV-Datei wählen.", href: "/inhaber/import" });
  if (file.size > 1_000_000) return reply(request, { ok: false, message: "Die Datei ist zu groß.", href: "/inhaber/import" });
  const result = await importOwnerCsv(user.id, await file.text());
  if (!result.ok) return reply(request, { ok: false, message: result.message, href: "/inhaber/import" });
  if (wantsJson(request)) {
    return NextResponse.json({ ok: true, ...result.report });
  }
  const response = NextResponse.redirect(new URL(withNotice("/inhaber/import", "Import geprüft.", "ok"), request.url), 303);
  response.cookies.set("rds_import", JSON.stringify(result.report), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 180 });
  return response;
}

function parseReport(raw: string | undefined) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { imported: number; acceptedRows: number; errors: { line: number; message: string }[] };
    if (!Array.isArray(value.errors)) return null;
    return value;
  } catch {
    return null;
  }
}
