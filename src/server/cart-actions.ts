"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ensureCart, readCartId, rememberOrder } from "@/lib/cart-cookie";
import { prisma } from "@/lib/db";
import { placeOrder } from "@/lib/orders";
import { safeNext, withNotice } from "@/lib/text";

export async function addToCart(formData: FormData) {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: { product: { include: { tenant: true } } },
  });
  const back = `/laden/${variant?.product.tenant.slug ?? ""}`;
  if (!variant || !variant.product.tenant.approved) {
    redirect(withNotice("/", "Diese Ware ist nicht erhältlich.", "fehler"));
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    redirect(withNotice(back, "Bitte eine Menge ab 1 angeben.", "fehler"));
  }
  const cartId = await ensureCart();
  const existing = await prisma.cartLine.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const next = (existing?.quantity ?? 0) + quantity;
  if (next > variant.stock) {
    redirect(withNotice(back, `Auf Lager sind ${variant.stock}.`, "fehler"));
  }
  await prisma.cartLine.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity },
    update: { quantity: next },
  });
  redirect(withNotice("/warenkorb", "In den Warenkorb gelegt.", "ok"));
}

export async function updateLine(formData: FormData) {
  const cartId = await readCartId();
  if (!cartId) redirect("/warenkorb");
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  if (!Number.isInteger(quantity) || quantity < 0) {
    redirect(withNotice("/warenkorb", "Die Menge ist ungültig.", "fehler"));
  }
  if (quantity === 0) {
    await prisma.cartLine.deleteMany({ where: { cartId, variantId } });
    redirect("/warenkorb");
  }
  const variant = await prisma.variant.findUnique({ where: { id: variantId } });
  if (!variant || quantity > variant.stock) {
    redirect(withNotice("/warenkorb", "Die Menge übersteigt den Bestand.", "fehler"));
  }
  await prisma.cartLine.update({
    where: { cartId_variantId: { cartId, variantId } },
    data: { quantity },
  });
  redirect("/warenkorb");
}

export async function chooseZone(formData: FormData) {
  const zoneId = String(formData.get("zoneId") ?? "");
  const returnTo = safeNext(String(formData.get("returnTo") ?? "/warenkorb"));
  const zone = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
  if (!zone) redirect(withNotice(returnTo, "Die Lieferzone ist unbekannt.", "fehler"));
  const cartId = await ensureCart();
  await prisma.cart.update({ where: { id: cartId }, data: { zoneId } });
  redirect(returnTo);
}

export async function checkout(formData: FormData) {
  const user = await currentUser();
  const cartId = await readCartId();
  if (!cartId) redirect(withNotice("/warenkorb", "Der Warenkorb ist leer.", "fehler"));
  const email = user?.role === "BUYER" ? user.email : String(formData.get("email") ?? "");
  const result = await placeOrder({
    cartId,
    email,
    zoneId: String(formData.get("zoneId") ?? ""),
    method: String(formData.get("method") ?? ""),
    userId: user && user.role === "BUYER" ? user.id : null,
  });
  if (!result.ok) redirect(withNotice("/kasse", result.message, "fehler"));
  await rememberOrder(result.accessToken);
  redirect(`/bestellung/${result.number}`);
}
