"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { writeSession } from "@/lib/session";
import { safeNext, withNotice } from "@/lib/text";

export async function loginAction(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const user = await login(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (!user) redirect(withNotice(`/anmelden?next=${encodeURIComponent(next)}`, "E-Mail oder Passwort stimmt nicht.", "fehler"));
  if (next !== "/") redirect(next);
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "OWNER") redirect("/inhaber");
  redirect("/konto");
}

export async function logoutAction() {
  await logout();
  redirect("/");
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2) redirect(withNotice("/anmelden", "Bitte einen Namen angeben.", "fehler"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(withNotice("/anmelden", "Bitte eine gültige E-Mail angeben.", "fehler"));
  if (password.length < 8) redirect(withNotice("/anmelden", "Das Passwort braucht mindestens 8 Zeichen.", "fehler"));
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect(withNotice("/anmelden", "Mit dieser E-Mail gibt es schon ein Konto.", "fehler"));
  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password), role: "BUYER" },
  });
  await prisma.order.updateMany({ where: { email, userId: null }, data: { userId: user.id } });
  await writeSession(user.id);
  redirect("/konto");
}
