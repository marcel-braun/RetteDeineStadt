import { Notice } from "@/components/notice";
import { one } from "@/ui/format";

export const metadata = { title: "Kunde registrieren" };

export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <section className="stack narrow">
      <p className="kicker">Kunde</p>
      <h1>Konto anlegen</h1>
      <p className="lede">Name, E-Mail und ein Passwort. Danach liegen die Bestellungen dieser E-Mail auf dem Konto.</p>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <form className="paper stack" action="/api/v1/auth/kunde" method="post">
        <label>
          Name
          <input name="name" required autoComplete="name" />
        </label>
        <label>
          E-Mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Passwort
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <button type="submit">Konto anlegen</button>
      </form>
    </section>
  );
}
