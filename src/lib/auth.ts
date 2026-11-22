import { redirect } from "next/navigation";
import { prisma } from "./db";
import { clearSession, readSessionUserId, writeSession } from "./session";

export async function currentUser() {
  const id = await readSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id }, include: { tenant: true } });
}

export async function requireRole(role: "ADMIN" | "OWNER" | "BUYER") {
  const user = await currentUser();
  const next = role === "ADMIN" ? "/admin" : role === "OWNER" ? "/inhaber" : "/konto";
  if (!user) redirect(`/anmelden?next=${next}`);
  if (user.role !== role) redirect("/");
  return user;
}

export async function login(email: string, password: string) {
  const { verifyPassword } = await import("./password");
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  await writeSession(user.id);
  return user;
}

export async function logout() {
  await clearSession();
}
