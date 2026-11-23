import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findUser } from "@/core/accounts";
import { openSession, sealSession } from "@/core/session-token";
import { safeNext, withNotice } from "@/core/text";

const cookieBase = { httpOnly: true, sameSite: "lax" as const, path: "/" };

export async function actor() {
  const jar = await cookies();
  const id = openSession(jar.get("rds_session")?.value);
  if (!id) return null;
  return findUser(id);
}

export async function readCartToken() {
  const jar = await cookies();
  return jar.get("rds_cart")?.value ?? null;
}

export async function knownOrderTokens() {
  const jar = await cookies();
  return (jar.get("rds_orders")?.value ?? "").split(",").filter(Boolean);
}

export function wantsJson(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json") && !accept.includes("text/html");
}

export async function readFields(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    const data = new FormData();
    for (const [key, value] of Object.entries(json)) {
      if (Array.isArray(value)) for (const entry of value) data.append(key, String(entry));
      else if (value !== null && value !== undefined) data.append(key, String(value));
    }
    return data;
  }
  return request.formData();
}

export function fieldMap(data: FormData) {
  const fields: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (typeof value === "string") fields[key] = value;
  }
  return fields;
}

type Outcome = { ok: boolean; message: string; href?: string; status?: number; extra?: Record<string, unknown> };

export async function reply(request: Request, outcome: Outcome, cookiesToSet?: { name: string; value: string; maxAge: number }[]) {
  const href = safeNext(outcome.href ?? "/");
  if (wantsJson(request)) {
    const response = NextResponse.json(
      outcome.ok ? { ok: true, message: outcome.message, ...outcome.extra } : { ok: false, error: outcome.message },
      { status: outcome.ok ? 200 : (outcome.status ?? 400) },
    );
    applyCookies(response, cookiesToSet);
    return response;
  }
  const target = outcome.ok ? withNotice(href, outcome.message, "ok") : withNotice(outcome.href ?? "/", outcome.message, "fehler");
  const response = NextResponse.redirect(new URL(target, request.url), 303);
  applyCookies(response, cookiesToSet);
  return response;
}

function applyCookies(response: NextResponse, cookiesToSet?: { name: string; value: string; maxAge: number }[]) {
  for (const cookie of cookiesToSet ?? []) {
    response.cookies.set(cookie.name, cookie.value, { ...cookieBase, maxAge: cookie.maxAge });
  }
}

export function sessionCookie(userId: string) {
  return { name: "rds_session", value: sealSession(userId), maxAge: 60 * 60 * 24 * 14 };
}

export function clearSessionCookie() {
  return { name: "rds_session", value: "", maxAge: 0 };
}

export function cartCookie(id: string) {
  return { name: "rds_cart", value: id, maxAge: 60 * 60 * 24 * 30 };
}

export function orderCookie(previous: string[], token: string) {
  const next = [token, ...previous.filter((entry) => entry && entry !== token)].slice(0, 20).join(",");
  return { name: "rds_orders", value: next, maxAge: 60 * 60 * 24 * 90 };
}

export async function requireActor(role: "ADMIN" | "OWNER" | "BUYER") {
  const user = await actor();
  if (!user || user.role !== role) return null;
  return user;
}
