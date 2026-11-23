import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { METHOD_LABEL } from "./fulfillment";
import { loadCartQuote, placeOrder } from "./orders";

export async function cartIdFromToken(token: string | null) {
  if (!token) return null;
  const cart = await prisma.cart.findUnique({ where: { id: token } });
  return cart?.id ?? null;
}

export async function ensureCartRecord(token: string | null) {
  const id = token && (await prisma.cart.findUnique({ where: { id: token } })) ? token : randomBytes(16).toString("hex");
  await prisma.cart.upsert({ where: { id }, create: { id }, update: {} });
  return id;
}

export async function addLine(cartId: string, variantId: string, quantity: number) {
  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: { product: { include: { tenant: true } } },
  });
  if (!variant || !variant.product.tenant.approved) return { ok: false as const, message: "Diese Ware ist nicht erhältlich.", href: "/" };
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false as const, message: "Bitte eine Menge ab 1 angeben.", href: `/laden/${variant.product.tenant.slug}` };
  }
  const existing = await prisma.cartLine.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const next = (existing?.quantity ?? 0) + quantity;
  if (next > variant.stock) {
    return { ok: false as const, message: `Auf Lager sind ${variant.stock}.`, href: `/laden/${variant.product.tenant.slug}` };
  }
  await prisma.cartLine.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity },
    update: { quantity: next },
  });
  return { ok: true as const, message: "In den Warenkorb gelegt.", href: "/warenkorb", cartId };
}

export async function setLine(cartId: string, variantId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0) return { ok: false as const, message: "Die Menge ist ungültig.", href: "/warenkorb" };
  if (quantity === 0) {
    await prisma.cartLine.deleteMany({ where: { cartId, variantId } });
    return { ok: true as const, message: "Position entfernt.", href: "/warenkorb" };
  }
  const variant = await prisma.variant.findUnique({ where: { id: variantId } });
  if (!variant || quantity > variant.stock) return { ok: false as const, message: "Die Menge übersteigt den Bestand.", href: "/warenkorb" };
  await prisma.cartLine.update({ where: { cartId_variantId: { cartId, variantId } }, data: { quantity } });
  return { ok: true as const, message: "Menge gesetzt.", href: "/warenkorb" };
}

export async function setZone(cartId: string, zoneId: string, returnTo: string) {
  const zone = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
  if (!zone) return { ok: false as const, message: "Die Lieferzone ist unbekannt.", href: returnTo };
  await prisma.cart.update({ where: { id: cartId }, data: { zoneId } });
  return { ok: true as const, message: "Lieferzone übernommen.", href: returnTo };
}

export async function cartCount(cartId: string | null) {
  if (!cartId) return 0;
  const sum = await prisma.cartLine.aggregate({ where: { cartId }, _sum: { quantity: true } });
  return sum._sum.quantity ?? 0;
}

export async function presentCart(cartId: string | null) {
  const view = await loadCartQuote(cartId);
  if (!view) return { empty: true as const };
  return {
    empty: view.lines.length === 0,
    zoneId: view.zone?.id ?? "",
    zoneName: view.zone?.name ?? "",
    zones: view.zones.map((zone) => ({ id: zone.id, name: zone.name })),
    lines: view.lines.map((line) => ({
      variantId: line.variantId,
      productName: line.productName,
      label: line.label,
      quantity: line.quantity,
      unitCents: line.unitCents,
      stock: line.stock,
      approved: line.approved,
      tenantName: line.tenantName,
    })),
    groups: view.quote.groups,
    options: view.quote.options.map((option) => ({
      method: option.method,
      label: METHOD_LABEL[option.method],
      available: option.available,
      priceCents: option.priceCents,
    })),
    cheapest: view.quote.cheapest
      ? { method: view.quote.cheapest.method, label: METHOD_LABEL[view.quote.cheapest.method], priceCents: view.quote.cheapest.priceCents }
      : null,
    goodsCents: view.quote.goodsCents,
    blocked: view.lines.some((line) => !line.approved || line.quantity > line.stock),
  };
}

export async function checkoutCart(input: { cartId: string; email: string; zoneId: string; method: string; userId: string | null }) {
  const result = await placeOrder(input);
  if (!result.ok) return { ok: false as const, message: result.message, href: "/kasse" };
  return { ok: true as const, message: "Bestellung aufgenommen.", href: `/bestellung/${result.number}`, number: result.number, accessToken: result.accessToken };
}

export async function presentOrder(number: string, access: { userId: string | null; role: string | null; tenantId: string | null; tokens: string[]; queryToken: string }) {
  const order = await prisma.order.findUnique({
    where: { number },
    include: { zone: true, parts: { include: { tenant: true, lines: true }, orderBy: { tenant: { name: "asc" } } } },
  });
  if (!order) return null;
  const allowed =
    access.role === "ADMIN" ||
    (access.userId !== null && access.userId === order.userId) ||
    order.parts.some((part) => part.tenantId === access.tenantId) ||
    access.tokens.includes(order.accessToken) ||
    access.queryToken === order.accessToken;
  if (!allowed) return { forbidden: true as const };
  return {
    forbidden: false as const,
    number: order.number,
    when: order.createdAt.toISOString(),
    email: order.email,
    method: METHOD_LABEL[order.method],
    methodKey: order.method,
    zone: order.zone?.name ?? "",
    shippingCents: order.shippingCents,
    goodsCents: order.goodsCents,
    totalCents: order.totalCents,
    paymentId: order.stripePaymentId,
    parts: order.parts.map((part) => ({
      tenant: part.tenant.name,
      pickupLabel: part.tenant.pickupLabel,
      pickupAddress: part.tenant.pickupAddress,
      lines: part.lines.map((line) => ({
        id: line.id,
        quantity: line.quantity,
        productName: line.productName,
        variantLabel: line.variantLabel,
        lineCents: line.unitCents * line.quantity,
      })),
    })),
  };
}

export async function accountOrders(userId: string) {
  const orders = await prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return orders.map((order) => ({
    number: order.number,
    when: order.createdAt.toISOString(),
    method: METHOD_LABEL[order.method],
    totalCents: order.totalCents,
  }));
}
