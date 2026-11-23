import Link from "next/link";
import { apiGet } from "@/ui/api";
import { formatEuro, formatWhen } from "@/ui/format";

export const metadata = { title: "Konto" };

type Account = { user: { name: string; email: string } | null; orders: { number: string; when: string; method: string; totalCents: number }[] };

export default async function AccountPage() {
  const account = await apiGet<Account>("/api/v1/konto");
  if (!account.user) {
    return (
      <section className="stack">
        <h1>Konto</h1>
        <p>Ein Konto ist freiwillig. Gastbestellungen mit derselben E-Mail erscheinen hier, sobald das Konto angelegt ist.</p>
        <Link className="button" href="/anmelden?next=/konto">Anmelden</Link>
      </section>
    );
  }
  return (
    <section className="stack">
      <h1>Hallo {account.user.name}</h1>
      <p className="quiet">{account.user.email}</p>
      {account.orders.length === 0 ? <p>Noch keine Bestellung auf diesem Konto.</p> : null}
      {account.orders.map((order) => (
        <Link className="paper shop-card" key={order.number} href={`/bestellung/${order.number}`}>
          <strong>{order.number}</strong>
          <div className="meta">{formatWhen(order.when)} · {order.method} · {formatEuro(order.totalCents)}</div>
        </Link>
      ))}
    </section>
  );
}
