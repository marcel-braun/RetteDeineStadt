import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { one } from "@/ui/format";

export const metadata = { title: "CSV-Import" };

type ImportDesk = {
  label: string;
  columns: string[];
  example: string[];
  report: { imported: number; acceptedRows: number; errors: { line: number; message: string }[] } | null;
};

export default async function ImportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const desk = await apiGet<ImportDesk>("/api/v1/inhaber/import");
  return (
    <section className="stack">
      <h1>CSV für {desk.label}</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p>Formular und CSV schreiben dieselben Produktdaten. Die Spalten kommen von der Branche. Ja und nein gelten für Ankreuzfelder, mehrere Allergene stehen mit Komma in einer Zelle.</p>
      <p><a href="/api/v1/inhaber/csv-vorlage">Vorlage herunterladen</a></p>
      <pre className="sample">{`${desk.columns.join(";")}\n${desk.example.join(";")}`}</pre>
      <form className="stack" action="/api/v1/inhaber/import" method="post" encType="multipart/form-data">
        <label>Datei<input name="datei" type="file" accept=".csv,text/csv" required /></label>
        <button type="submit">Importieren</button>
      </form>
      {desk.report ? (
        <section className="paper stack">
          <h2>Letzter Import</h2>
          <p>{desk.report.imported} Produkte übernommen, {desk.report.acceptedRows} gültige Zeilen.</p>
          {desk.report.errors.length === 0 ? <p>Keine fehlerhaften Zeilen.</p> : null}
          <ul>
            {desk.report.errors.map((error) => <li key={`${error.line}-${error.message}`}>Zeile {error.line}: {error.message}</li>)}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
