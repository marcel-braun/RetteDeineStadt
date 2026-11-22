import { cookies } from "next/headers";
import { Notice } from "@/components/notice";
import { importCsv } from "@/server/owner-actions";
import { requireRole } from "@/lib/auth";
import { CSV_BASE } from "@/lib/csv";
import { findIndustry } from "@/lib/industries/registry";
import { one } from "@/lib/text";

export const metadata = { title: "CSV-Import" };

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireRole("OWNER");
  const industry = user.tenant ? findIndustry(user.tenant.industryKey) : null;
  if (!industry) return <p>Die Branche fehlt.</p>;
  const raw = (await cookies()).get("rds_import")?.value;
  const report = parseReport(raw);
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

  return (
    <section className="stack">
      <h1>CSV für {industry.label}</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p>Formular und CSV schreiben dieselben Produktdaten. Die Spalten kommen von der Branche. Ja und nein gelten für Ankreuzfelder.</p>
      <p>
        <a href="/api/inhaber/csv-vorlage">Vorlage herunterladen</a>
      </p>
      <pre className="sample">{`${columns.join(";")}\n${example.join(";")}`}</pre>
      <form className="stack" action={importCsv}>
        <label>
          Datei
          <input name="datei" type="file" accept=".csv,text/csv" required />
        </label>
        <button type="submit">Importieren</button>
      </form>
      {report ? (
        <section className="paper stack">
          <h2>Letzter Import</h2>
          <p>
            {report.imported} Produkte übernommen, {report.acceptedRows} gültige Zeilen.
          </p>
          {report.errors.length === 0 ? <p>Keine fehlerhaften Zeilen.</p> : null}
          <ul>
            {report.errors.map((error) => (
              <li key={`${error.line}-${error.message}`}>
                Zeile {error.line}: {error.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
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
