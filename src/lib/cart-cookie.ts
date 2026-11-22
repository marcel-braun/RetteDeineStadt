import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

export async function readCartId() {
  const jar = await cookies();
  return jar.get("rds_cart")?.value ?? null;
}

export async function ensureCart() {
  const jar = await cookies();
  let id = jar.get("rds_cart")?.value;
  if (!id) {
    id = randomBytes(16).toString("hex");
    jar.set("rds_cart", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  await prisma.cart.upsert({ where: { id }, create: { id }, update: {} });
  return id;
}

export async function rememberOrder(token: string) {
  const jar = await cookies();
  const previous = jar.get("rds_orders")?.value ?? "";
  const next = [token, ...previous.split(",").filter(Boolean)].slice(0, 20).join(",");
  jar.set("rds_orders", next, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
}

export async function knownOrders() {
  const jar = await cookies();
  return (jar.get("rds_orders")?.value ?? "").split(",").filter(Boolean);
}
