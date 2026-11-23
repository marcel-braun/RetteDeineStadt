import Link from "next/link";
import { Notice } from "@/components/notice";
import { one } from "@/ui/format";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = one(params.next);
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <section className="stack narrow">
      <h1>Anmelden</h1>
      <Notice hinweis={one(params.hinweis)} art={one(params.art)} />
      <p className="quiet">
        Noch kein Konto? <Link href="/registrieren/kunde">Als Kunde registrieren</Link> oder{" "}
        <Link href="/registrieren/laden">einen Laden anmelden</Link>.
      </p>
      <form className="paper stack" action="/api/v1/auth/anmelden" method="post">
        <input type="hidden" name="next" value={safe} />
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
      <p className="quiet">Pilot: admin@pilot.local / pilot-admin, hofladen@pilot.local / pilot-inhaber, kaeufer@pilot.local / pilot-kaeufer.</p>
    </section>
  );
}
