import { Notice } from "@/components/notice";
import { loginAction, registerAction } from "@/server/auth-actions";
import { one, safeNext } from "@/lib/text";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNext(one(params.next));
  return (
    <section className="stack">
      <h1>Anmelden</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p className="quiet">Der Kauf geht auch ohne Konto. Ein Konto zeigt später die eigenen Bestellungen.</p>
      <div className="two">
        <form className="paper stack" action={loginAction}>
          <h2>Ich habe ein Konto</h2>
          <input type="hidden" name="next" value={next} />
          <label>
            E-Mail
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            Passwort
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button type="submit">Anmelden</button>
        </form>
        <form className="paper stack" action={registerAction}>
          <h2>Konto anlegen</h2>
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            E-Mail
            <input name="email" type="email" required />
          </label>
          <label>
            Passwort
            <input name="password" type="password" required minLength={8} />
          </label>
          <button type="submit">Konto anlegen</button>
        </form>
      </div>
      <p className="quiet">
        Pilot: admin@pilot.local / pilot-admin, Inhaber zum Beispiel hofladen@pilot.local / pilot-inhaber, Käufer kaeufer@pilot.local /
        pilot-kaeufer.
      </p>
    </section>
  );
}
