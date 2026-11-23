import { prisma } from "./db";
import { findIndustry } from "./industries/registry";
import { hashPassword, verifyPassword } from "./password";
import { PILOT_CENTER } from "./region";
import { slugify } from "./text";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function findUser(id: string) {
  return prisma.user.findUnique({ where: { id }, include: { tenant: true } });
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export async function registerBuyer(input: { name: string; email: string; password: string }) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false as const, message: "Bitte einen Namen angeben." };
  if (!emailPattern.test(email)) return { ok: false as const, message: "Bitte eine gültige E-Mail angeben." };
  if (input.password.length < 8) return { ok: false as const, message: "Das Passwort braucht mindestens 8 Zeichen." };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, message: "Mit dieser E-Mail gibt es schon ein Konto." };
  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(input.password), role: "BUYER" },
  });
  await prisma.order.updateMany({ where: { email, userId: null }, data: { userId: user.id } });
  return { ok: true as const, user };
}

function placeNearCenter(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 33 + char.charCodeAt(0)) % 1000;
  return {
    latitude: PILOT_CENTER.lat + ((hash % 50) - 25) * 0.00035,
    longitude: PILOT_CENTER.lng + ((Math.floor(hash / 50) % 50) - 25) * 0.00035,
  };
}

export async function registerShop(input: {
  ownerName: string;
  email: string;
  password: string;
  shopName: string;
  industryKey: string;
  openingHours: string;
  pickupAddress: string;
  story: string;
}) {
  const ownerName = input.ownerName.trim();
  const shopName = input.shopName.trim();
  const email = input.email.trim().toLowerCase();
  const industry = findIndustry(input.industryKey);
  if (!industry) return { ok: false as const, message: "Die Branche ist unbekannt." };
  if (ownerName.length < 2 || shopName.length < 2) return { ok: false as const, message: "Name und Laden brauchen einen Text." };
  if (!emailPattern.test(email)) return { ok: false as const, message: "Bitte eine gültige E-Mail angeben." };
  if (input.password.length < 8) return { ok: false as const, message: "Das Passwort braucht mindestens 8 Zeichen." };
  const story = input.story.trim();
  const openingHours = input.openingHours.trim();
  const pickupAddress = input.pickupAddress.trim();
  if (!story || !openingHours || !pickupAddress) {
    return { ok: false as const, message: "Öffnungszeiten, Abholadresse und eine kurze Geschichte fehlen." };
  }
  if (story.length > 800) return { ok: false as const, message: "Die Geschichte ist zu lang." };
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) return { ok: false as const, message: "Mit dieser E-Mail gibt es schon ein Konto." };
  let slug = slugify(shopName) || "laden";
  if (await prisma.tenant.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const spot = placeNearCenter(shopName);
  const tenant = await prisma.tenant.create({
    data: {
      name: shopName,
      slug,
      industryKey: industry.key,
      approved: false,
      openingHours,
      story,
      pickupLabel: "Abholung",
      pickupAddress,
      latitude: spot.latitude,
      longitude: spot.longitude,
    },
  });
  const user = await prisma.user.create({
    data: { name: ownerName, email, passwordHash: hashPassword(input.password), role: "OWNER", tenantId: tenant.id },
  });
  return { ok: true as const, user, tenant };
}
