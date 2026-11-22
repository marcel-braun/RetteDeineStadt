import { currentUser } from "@/lib/auth";
import { CSV_BASE } from "@/lib/csv";
import { findIndustry } from "@/lib/industries/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  const industry = user?.role === "OWNER" && user.tenant ? findIndustry(user.tenant.industryKey) : null;
  if (!industry) return new Response("Nicht angemeldet.", { status: 401 });
  const columns = [...CSV_BASE, ...industry.fields.map((field) => field.key)];
  const example = [
    "beispiel",
    "Beispielprodukt",
    "Kurzbeschreibung",
    industry.categories[0]?.key ?? "",
    "",
    "Standard",
    "3,50",
    "10",
    ...industry.fields.map((field) => (field.type === "boolean" ? "nein" : field.type === "select" ? (field.options?.[0]?.value ?? "") : "Beispiel")),
  ];
  const body = `\uFEFF${columns.join(";")}\n${example.join(";")}\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vorlage-${industry.key}.csv"`,
    },
  });
}
