import { Notice } from "@/components/notice";
import { createTenant } from "@/server/admin-actions";
import { listIndustries } from "@/lib/industries/registry";
import { PILOT_CENTER } from "@/lib/region";
import { one } from "@/lib/text";

export const metadata = { title: "Neuer Mandant" };

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const industries = listIndustries();
  return (
    <section className="stack">
      <h1>Neuer Mandant</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p className="quiet">Der Laden bleibt unsichtbar, bis du ihn freigibst. Der individuelle Satz startet bei 0.</p>
      <form className="stack" action={createTenant}>
        <div className="two">
          <label>
            Name des Ladens
            <input name="name" required />
          </label>
          <label>
            Branche
            <select name="industryKey" defaultValue={industries[0]?.key}>
              {industries.map((industry) => (
                <option key={industry.key} value={industry.key}>
                  {industry.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="two">
          <label>
            Name des Inhabers
            <input name="ownerName" required />
          </label>
          <label>
            E-Mail des Inhabers
            <input name="email" type="email" required />
          </label>
        </div>
        <label>
          Passwort des Inhabers
          <input name="password" type="text" required minLength={8} defaultValue="pilot-inhaber" />
        </label>
        <div className="two">
          <label>
            Breite
            <input name="latitude" required defaultValue={PILOT_CENTER.lat} />
          </label>
          <label>
            Länge
            <input name="longitude" required defaultValue={PILOT_CENTER.lng} />
          </label>
        </div>
        <label>
          Öffnungszeiten
          <textarea name="openingHours" />
        </label>
        <div className="two">
          <label>
            Abholort
            <input name="pickupLabel" />
          </label>
          <label>
            Adresse
            <input name="pickupAddress" />
          </label>
        </div>
        <label>
          Geschichte
          <textarea name="story" />
        </label>
        <button type="submit">Mandant anlegen</button>
      </form>
    </section>
  );
}
