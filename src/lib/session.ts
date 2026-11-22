import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET fehlt.");
  return "dev-only-session-secret";
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("hex");
}

export function sealSession(userId: string) {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 14;
  const body = `${userId}.${expires}`;
  return `${body}.${sign(body)}`;
}

export function openSession(value: string | undefined) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expires, mac] = parts;
  const expected = sign(`${userId}.${expires}`);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  if (Number(expires) < Date.now()) return null;
  return userId;
}

export async function readSessionUserId() {
  const jar = await cookies();
  return openSession(jar.get("rds_session")?.value);
}

export async function writeSession(userId: string) {
  const jar = await cookies();
  jar.set("rds_session", sealSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete("rds_session");
}
