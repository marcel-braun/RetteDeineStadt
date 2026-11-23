import Link from "next/link";
import { apiGet } from "@/ui/api";

type Session = { user: { name: string; role: "ADMIN" | "OWNER" | "BUYER" } | null; cartCount: number };

export async function Header() {
  const session = await apiGet<Session>("/api/v1/sitzung");
  const user = session.user;
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <Link className="wordmark" href="/">
          RetteDeineStadt
        </Link>
        <span className="quiet">{user ? user.name : "Gast"}</span>
      </div>
      <div className="wrap nav-row">
        <nav className="nav" aria-label="Hauptnavigation">
          <Link href="/entdecken">Entdecken</Link>
          <Link href="/warenkorb">Warenkorb{session.cartCount > 0 ? ` (${session.cartCount})` : ""}</Link>
          <Link href="/konto">Konto</Link>
          {user?.role === "OWNER" ? <Link href="/inhaber">Mein Laden</Link> : null}
          {user?.role === "ADMIN" ? <Link href="/admin">Verwaltung</Link> : null}
        </nav>
        {user ? (
          <form action="/api/v1/auth/abmelden" method="post">
            <button className="secondary" type="submit">
              Abmelden
            </button>
          </form>
        ) : (
          <Link href="/anmelden">Anmelden</Link>
        )}
      </div>
    </header>
  );
}
