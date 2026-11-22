import { randomBytes } from "node:crypto";
import type { FulfillmentMethod, Prisma } from "@prisma/client";
import { commissionOf } from "./commission";
import { prisma } from "./db";
import { isPricedMethod, type Grant, type ZonePrice } from "./fulfillment";
import { createConnect } from "./payments";
import { assembleQuote, type QuoteLine } from "./quote";

export type PlaceInput = {
  cartId: string;
  email: string;
  zoneId: string;
  method: string;
  userId: string | null;
};

export type PlaceResult = { ok: true; number: string; accessToken: string } | { ok: false; message: string };

class OrderRefusal extends Error {}

const lineInclude = {
  variant: { include: { product: { include: { tenant: true } } } },
} satisfies Prisma.CartLineInclude;

function asGrants(rows: { tenantId: string; zoneId: string; method: string }[]): Grant[] {
  return rows.flatMap((row) => (isPricedMethod(row.method) ? [{ tenantId: row.tenantId, zoneId: row.zoneId, method: row.method }] : []));
}

function asPrices(rows: { zoneId: string; method: string; priceCents: number }[]): ZonePrice[] {
  return rows.flatMap((row) => (isPricedMethod(row.method) ? [{ zoneId: row.zoneId, method: row.method, priceCents: row.priceCents }] : []));
}

export async function loadCartQuote(cartId: string | null) {
  if (!cartId) return null;
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { lines: { include: lineInclude } } });
  if (!cart) return null;
  const zones = await prisma.deliveryZone.findMany({ orderBy: { sort: "asc" }, include: { prices: true } });
  const zone = zones.find((item) => item.id === cart.zoneId) ?? zones[0] ?? null;
  const tenantIds = [...new Set(cart.lines.map((line) => line.variant.product.tenantId))];
  const grants = await prisma.tenantZoneMethod.findMany({ where: { tenantId: { in: tenantIds } } });
  const lines: QuoteLine[] = cart.lines.map((line) => ({
    variantId: line.variantId,
    quantity: line.quantity,
    unitCents: line.variant.priceCents,
    label: line.variant.label,
    productName: line.variant.product.name,
    tenantId: line.variant.product.tenantId,
    tenantName: line.variant.product.tenant.name,
    tenantSlug: line.variant.product.tenant.slug,
    pickupLabel: line.variant.product.tenant.pickupLabel,
    pickupAddress: line.variant.product.tenant.pickupAddress,
    approved: line.variant.product.tenant.approved,
    stock: line.variant.stock,
  }));
  const quote = assembleQuote(lines, zone?.id ?? null, asGrants(grants), asPrices(zone?.prices ?? []));
  return { cart, zone, zones, quote, lines };
}

export async function placeOrder(input: PlaceInput): Promise<PlaceResult> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Bitte eine gültige E-Mail angeben." };

  try {
    const created = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { id: input.cartId }, include: { lines: { include: lineInclude } } });
      if (!cart || cart.lines.length === 0) throw new OrderRefusal("Der Warenkorb ist leer.");
      const zone = await tx.deliveryZone.findUnique({ where: { id: input.zoneId }, include: { prices: true } });
      if (!zone) throw new OrderRefusal("Die Lieferzone ist unbekannt.");

      const fresh = [];
      for (const line of cart.lines) {
        const variant = await tx.variant.findUnique({
          where: { id: line.variantId },
          include: { product: { include: { tenant: true } } },
        });
        if (!variant) throw new OrderRefusal("Eine Ware ist nicht mehr im Sortiment.");
        if (!variant.product.tenant.approved) throw new OrderRefusal("Ein Laden in der Bestellung ist nicht freigegeben.");
        if (line.quantity < 1 || line.quantity > variant.stock) throw new OrderRefusal("Eine Menge übersteigt den Bestand.");
        fresh.push({ line, variant });
      }

      const tenantIds = [...new Set(fresh.map(({ variant }) => variant.product.tenantId))];
      const grants = await tx.tenantZoneMethod.findMany({ where: { tenantId: { in: tenantIds } } });
      const quote = assembleQuote(
        fresh.map(({ line, variant }) => ({
          variantId: variant.id,
          quantity: line.quantity,
          unitCents: variant.priceCents,
          label: variant.label,
          productName: variant.product.name,
          tenantId: variant.product.tenantId,
          tenantName: variant.product.tenant.name,
          tenantSlug: variant.product.tenant.slug,
          pickupLabel: variant.product.tenant.pickupLabel,
          pickupAddress: variant.product.tenant.pickupAddress,
          approved: true,
          stock: variant.stock,
        })),
        zone.id,
        asGrants(grants),
        asPrices(zone.prices),
      );

      let method: FulfillmentMethod;
      let shippingCents = 0;
      if (input.method === "PICKUP") method = "PICKUP";
      else if (quote.cheapest && input.method === quote.cheapest.method) {
        method = quote.cheapest.method;
        shippingCents = quote.cheapest.priceCents;
      } else throw new OrderRefusal("Dieser Versandweg gilt für die Läden in der Zone nicht.");

      const settings = await tx.platformSettings.findUnique({ where: { id: 1 } });
      const globalBps = settings?.globalCommissionBps ?? 0;
      const tenants = await tx.tenant.findMany({ where: { id: { in: tenantIds } } });
      const parts = quote.groups.map((group) => {
        const tenant = tenants.find((item) => item.id === group.tenantId);
        if (!tenant) throw new OrderRefusal("Ein Laden fehlt.");
        const money = commissionOf(group.goodsCents, globalBps, tenant.individualCommissionBps);
        if (money.payoutCents < 0) throw new OrderRefusal("Der Provisionssatz übersteigt 100 Prozent.");
        return { group, tenant, money };
      });

      const counter = await tx.counter.upsert({
        where: { id: "order" },
        create: { id: "order", value: 1 },
        update: { value: { increment: 1 } },
      });
      const number = `RD-${String(counter.value).padStart(5, "0")}`;

      for (const { line, variant } of fresh) {
        const updated = await tx.variant.updateMany({
          where: { id: variant.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count !== 1) throw new OrderRefusal("Der Bestand hat sich gerade geändert. Bitte den Warenkorb prüfen.");
      }

      const accountUser = input.userId
        ? await tx.user.findUnique({ where: { id: input.userId } })
        : await tx.user.findUnique({ where: { email } });
      const connect = createConnect();
      const accounts = new Map<string, string>();
      for (const { tenant } of parts) {
        const accountId = await connect.ensureConnectedAccount({
          tenantId: tenant.id,
          displayName: tenant.name,
          existingAccountId: tenant.stripeAccountId,
        });
        accounts.set(tenant.id, accountId);
        if (tenant.stripeAccountId !== accountId) {
          await tx.tenant.update({ where: { id: tenant.id }, data: { stripeAccountId: accountId } });
        }
      }
      const payment = await connect.createPlatformCharge({
        orderNumber: number,
        email,
        totalCents: quote.goodsCents + shippingCents,
        splits: parts.map(({ group, money, tenant }) => ({
          tenantId: tenant.id,
          connectedAccountId: accounts.get(tenant.id) ?? "",
          goodsCents: group.goodsCents,
          commissionCents: money.commissionCents,
          payoutCents: money.payoutCents,
        })),
      });
      if (payment.status !== "succeeded") throw new OrderRefusal("Die Zahlung konnte nicht vorgemerkt werden.");

      const payouts = new Map<string, string>();
      for (const { tenant, money } of parts) {
        const payout = await connect.schedulePayout({
          connectedAccountId: accounts.get(tenant.id) ?? "",
          amountCents: money.payoutCents,
          cadence: tenant.payoutCadence,
          orderNumber: number,
          tenantId: tenant.id,
        });
        payouts.set(tenant.id, payout.payoutId);
      }

      const accessToken = randomBytes(18).toString("hex");
      await tx.order.create({
        data: {
          number,
          accessToken,
          email,
          userId: accountUser?.id ?? null,
          zoneId: zone.id,
          method,
          shippingCents,
          goodsCents: quote.goodsCents,
          totalCents: quote.goodsCents + shippingCents,
          status: "PLACED",
          stripePaymentId: payment.paymentId,
          parts: {
            create: parts.map(({ group, tenant, money }) => ({
              tenantId: tenant.id,
              goodsCents: group.goodsCents,
              globalBps,
              individualBps: tenant.individualCommissionBps,
              commissionCents: money.commissionCents,
              payoutCents: money.payoutCents,
              payoutCadence: tenant.payoutCadence,
              stripePayoutId: payouts.get(tenant.id),
              lines: {
                create: group.lines.map((item) => ({
                  variantId: item.variantId,
                  productName: item.productName,
                  variantLabel: item.label,
                  quantity: item.quantity,
                  unitCents: item.unitCents,
                })),
              },
            })),
          },
        },
      });
      await tx.cartLine.deleteMany({ where: { cartId: cart.id } });
      return { number, accessToken };
    });
    return { ok: true, number: created.number, accessToken: created.accessToken };
  } catch (error) {
    if (error instanceof OrderRefusal) return { ok: false, message: error.message };
    console.error(error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Stripe")) return { ok: false, message };
    return { ok: false, message: "Die Bestellung konnte nicht aufgenommen werden." };
  }
}
