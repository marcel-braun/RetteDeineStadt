import { Notice } from "@/components/notice";
import { apiGet } from "@/ui/api";
import { one } from "@/ui/format";

export const metadata = { title: "Angaben zum Laden" };

type Profile = { openingHours: string; pickupLabel: string; pickupAddress: string; story: string };

export default async function ShopProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const profile = await apiGet<Profile>("/api/v1/inhaber/laden");
  return (
    <section className="stack">
      <h1>Angaben zum Laden</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p className="quiet">Öffnungszeiten, Abholort und eine kurze Geschichte. Die Verwaltung sieht sie vor der Freigabe.</p>
      <form className="stack" action="/api/v1/inhaber/laden" method="post">
        <label>Öffnungszeiten<textarea name="openingHours" required defaultValue={profile.openingHours} /></label>
        <div className="two">
          <label>Abholort<input name="pickupLabel" required defaultValue={profile.pickupLabel} /></label>
          <label>Adresse<input name="pickupAddress" required defaultValue={profile.pickupAddress} /></label>
        </div>
        <label>Geschichte<textarea name="story" required maxLength={800} defaultValue={profile.story} /></label>
        <button type="submit">Speichern</button>
      </form>
    </section>
  );
}
