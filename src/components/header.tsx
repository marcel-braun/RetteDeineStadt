import Link from "next/link";
import { logoutAction } from "@/server/auth-actions";
import { currentUser } from "@/lib/auth";
import { readCartId } from "@/lib/cart-cookie";
import { prisma } from "@/lib/db";

export async function Header() {
  const user = await currentUser();
  const cartId = await readCartId();
  const count = cartId
    ? ((await prisma.cartLine.aggregate({ where: { cartId }, _sum: { quantity: true } }))._sum.quantity ?? 0)
    : 0;

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
          <Link href="/">Entdecken</Link>
          <Link href="/warenkorb">Warenkorb{count > 0 ? ` (${count})` : ""}</Link>
          <Link href="/konto">Konto</Link>
          {user?.role === "OWNER" ? <Link href="/inhaber">Mein Laden</Link> : null}
          {user?.role === "ADMIN" ? <Link href="/admin">Verwaltung</Link> : null}
        </nav>
        {user ? (
          <form action={logoutAction}>
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
