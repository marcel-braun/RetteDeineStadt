import { notFound } from "next/navigation";
import { ApiError, apiGet } from "@/ui/api";
import { formatEuro, formatWhen, one } from "@/ui/format";

export const metadata = { title: "Bestellung" };

type Order = {
  number: string; when: string; email: string; method: string; methodKey: string; zone: string;
  shippingCents: number; goodsCents: number; totalCents: number; paymentId: string | null;
  parts: { tenant: string; pickupLabel: string; pickupAddress: string; lines: { id: string; quantity: number; productName: string; variantLabel: string; lineCents: number }[] }[];
};

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { number } = await params;
  const query = await searchParams;
  const zugang = one(query.zugang);
  let order: Order;
  try {
    order = await apiGet<Order>(`/api/v1/bestellungen/${number}${zugang ? `?zugang=${encodeURIComponent(zugang)}` : ""}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401)) notFound();
    throw error;
  }
  return (
    <article className="stack">
      <p className="kicker">{formatWhen(order.when)}</p>
      <h1>Bestellung {order.number}</h1>
      <p>Die Bestellung ist aufgenommen. Die Zahlung {order.paymentId} ist über die vorbereitete Schnittstelle vorgemerkt und wird nicht ausgeführt. Der Bestand der Varianten ist für diese Bestellung reduziert.</p>
      <p>{order.email} · {order.method}{order.zone ? ` · ${order.zone}` : ""} · Versand {order.shippingCents === 0 ? "kostenlos" : formatEuro(order.shippingCents)}</p>
      {order.parts.map((part) => (
        <section className="paper" key={part.tenant}>
          <h2>{part.tenant}</h2>
          <ul>
            {part.lines.map((line) => (
              <li key={line.id}>{line.quantity} × {line.productName} ({line.variantLabel}) · {formatEuro(line.lineCents)}</li>
            ))}
          </ul>
          {order.methodKey === "PICKUP" ? <p className="meta">Abholung: {part.pickupLabel}, {part.pickupAddress}</p> : null}
        </section>
      ))}
      <p>Warenwert {formatEuro(order.goodsCents)} · Gesamt {formatEuro(order.totalCents)}</p>
    </article>
  );
}
