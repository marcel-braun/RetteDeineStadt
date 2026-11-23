import { requireActor } from "@/api/http";
import { csvTemplate } from "@/core/desk";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireActor("OWNER");
  const template = user?.tenant ? csvTemplate(user.tenant.industryKey) : null;
  if (!template) return new Response("Nicht angemeldet.", { status: 401 });
  return new Response(template.body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vorlage-${template.key}.csv"`,
    },
  });
}
