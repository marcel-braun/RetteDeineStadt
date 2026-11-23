import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { one } from "@/ui/format";

export const metadata = { title: "Neuer Mandant" };

export default async function NewTenantPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await apiGet<{ industries: { key: string; label: string }[] }>("/api/v1/verwaltung/mandanten");
  return (
    <section className="stack">
      <h1>Neuer Mandant</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p className="quiet">Der Laden bleibt unsichtbar, bis du ihn freigibst. Der individuelle Satz startet bei 0.</p>
      <form className="stack" action="/api/v1/verwaltung/mandanten" method="post">
        <div className="two">
          <label>Name des Ladens<input name="name" required /></label>
          <label>Branche
            <select name="industryKey" defaultValue={data.industries[0]?.key}>
              {data.industries.map((industry) => <option key={industry.key} value={industry.key}>{industry.label}</option>)}
            </select>
          </label>
        </div>
        <div className="two">
          <label>Name des Inhabers<input name="ownerName" required /></label>
          <label>E-Mail des Inhabers<input name="email" type="email" required /></label>
        </div>
        <label>Passwort des Inhabers<input name="password" type="text" required minLength={8} defaultValue="pilot-inhaber" /></label>
        <label>Öffnungszeiten<textarea name="openingHours" /></label>
        <div className="two">
          <label>Abholort<input name="pickupLabel" /></label>
          <label>Adresse<input name="pickupAddress" /></label>
        </div>
        <label>Geschichte<textarea name="story" /></label>
        <button type="submit">Mandant anlegen</button>
      </form>
    </section>
  );
}
