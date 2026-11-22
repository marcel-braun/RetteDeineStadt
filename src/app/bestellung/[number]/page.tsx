import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { knownOrders } from "@/lib/cart-cookie";
import { prisma } from "@/lib/db";
import { METHOD_LABEL } from "@/lib/fulfillment";
import { formatEuro } from "@/lib/money";
import { formatWhen, one } from "@/lib/text";

export const metadata = { title: "Bestellung" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { number } = await params;
  const query = await searchParams;
  const order = await prisma.order.findUnique({
    where: { number },
    include: { zone: true, parts: { include: { tenant: true, lines: true }, orderBy: { tenant: { name: "asc" } } } },
  });
  if (!order) notFound();
  const user = await currentUser();
  const seen = await knownOrders();
  const allowed =
    user?.role === "ADMIN" ||
    user?.id === order.userId ||
    order.parts.some((part) => part.tenantId === user?.tenantId) ||
    seen.includes(order.accessToken) ||
    one(query.zugang) === order.accessToken;
  if (!allowed) notFound();

  return (
    <article className="stack">
      <p className="kicker">{formatWhen(order.createdAt)}</p>
      <h1>Bestellung {order.number}</h1>
      <p>
        Die Bestellung ist aufgenommen. Die Zahlung {order.stripePaymentId} ist über die vorbereitete Schnittstelle vorgemerkt und wird nicht ausgeführt.
        Der Bestand der Varianten ist für diese Bestellung reduziert.
      </p>
      <p>
        {order.email} · {METHOD_LABEL[order.method]}
        {order.zone ? ` · ${order.zone.name}` : ""} · Versand {order.shippingCents === 0 ? "kostenlos" : formatEuro(order.shippingCents)}
      </p>
      {order.parts.map((part) => (
        <section className="paper" key={part.id}>
          <h2>{part.tenant.name}</h2>
          <ul>
            {part.lines.map((line) => (
              <li key={line.id}>
                {line.quantity} × {line.productName} ({line.variantLabel}) · {formatEuro(line.unitCents * line.quantity)}
              </li>
            ))}
          </ul>
          {order.method === "PICKUP" ? (
            <p className="meta">
              Abholung: {part.tenant.pickupLabel}, {part.tenant.pickupAddress}
            </p>
          ) : null}
        </section>
      ))}
      <p>
        Warenwert {formatEuro(order.goodsCents)} · Gesamt {formatEuro(order.totalCents)}
      </p>
    </article>
  );
}
