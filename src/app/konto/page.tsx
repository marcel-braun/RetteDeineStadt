import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { METHOD_LABEL } from "@/lib/fulfillment";
import { formatEuro } from "@/lib/money";
import { formatWhen } from "@/lib/text";

export const metadata = { title: "Konto" };

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <section className="stack">
        <h1>Konto</h1>
        <p>Ein Konto ist freiwillig. Gastbestellungen mit derselben E-Mail erscheinen hier, sobald das Konto angelegt ist.</p>
        <Link className="button" href="/anmelden?next=/konto">
          Anmelden oder Konto anlegen
        </Link>
      </section>
    );
  }
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <section className="stack">
      <h1>Hallo {user.name}</h1>
      <p className="quiet">{user.email}</p>
      {orders.length === 0 ? <p>Noch keine Bestellung auf diesem Konto.</p> : null}
      {orders.map((order) => (
        <Link className="paper shop-card" key={order.id} href={`/bestellung/${order.number}`}>
          <strong>{order.number}</strong>
          <div className="meta">
            {formatWhen(order.createdAt)} · {METHOD_LABEL[order.method]} · {formatEuro(order.totalCents)}
          </div>
        </Link>
      ))}
    </section>
  );
}
