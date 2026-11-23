import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { one } from "@/ui/format";

export const metadata = { title: "Laden anmelden" };

export default async function ShopRegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const data = await apiGet<{ industries: { key: string; label: string }[] }>("/api/v1/branchen");
  return (
    <section className="stack narrow">
      <p className="kicker">Lieferant</p>
      <h1>Laden anmelden</h1>
      <p className="lede">Kurze Angaben zum Laden. Er wartet auf die Freigabe und ist bis dahin für Käufer unsichtbar.</p>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <form className="paper stack" action="/api/v1/auth/laden" method="post">
        <label>
          Dein Name
          <input name="ownerName" required />
        </label>
        <label>
          E-Mail
          <input name="email" type="email" required />
        </label>
        <label>
          Passwort
          <input name="password" type="password" required minLength={8} />
        </label>
        <label>
          Name des Ladens
          <input name="shopName" required />
        </label>
        <label>
          Branche
          <select name="industryKey" defaultValue={data.industries[0]?.key}>
            {data.industries.map((industry) => (
              <option key={industry.key} value={industry.key}>
                {industry.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Öffnungszeiten
          <textarea name="openingHours" required />
        </label>
        <label>
          Abholadresse
          <input name="pickupAddress" required />
        </label>
        <label>
          Kurze Geschichte
          <textarea name="story" required maxLength={800} />
        </label>
        <button type="submit">Laden anmelden</button>
      </form>
    </section>
  );
}
