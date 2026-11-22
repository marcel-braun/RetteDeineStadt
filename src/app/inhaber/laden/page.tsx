import { Notice } from "@/components/notice";
import { saveShopProfile } from "@/server/owner-actions";
import { requireRole } from "@/lib/auth";
import { one } from "@/lib/text";

export const metadata = { title: "Angaben zum Laden" };

export default async function ShopProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireRole("OWNER");
  const tenant = user.tenant;
  if (!tenant) return <p>Kein Laden.</p>;
  return (
    <section className="stack">
      <h1>Angaben zum Laden</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p className="quiet">Öffnungszeiten, Abholort und eine kurze Geschichte. Die Verwaltung sieht sie vor der Freigabe.</p>
      <form className="stack" action={saveShopProfile}>
        <label>
          Öffnungszeiten
          <textarea name="openingHours" required defaultValue={tenant.openingHours} />
        </label>
        <div className="two">
          <label>
            Abholort
            <input name="pickupLabel" required defaultValue={tenant.pickupLabel} />
          </label>
          <label>
            Adresse
            <input name="pickupAddress" required defaultValue={tenant.pickupAddress} />
          </label>
        </div>
        <label>
          Geschichte
          <textarea name="story" required maxLength={800} defaultValue={tenant.story} />
        </label>
        <button type="submit">Speichern</button>
      </form>
    </section>
  );
}
