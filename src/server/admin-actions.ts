"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPricedMethod } from "@/lib/fulfillment";
import { findIndustry } from "@/lib/industries/registry";
import { hashPassword } from "@/lib/password";
import { parseMinorUnits } from "@/lib/money";
import { slugify, withNotice } from "@/lib/text";

async function ratesStayInBounds(globalBps: number, extraTenant?: { id?: string; individualBps: number }) {
  const tenants = await prisma.tenant.findMany({ select: { id: true, individualCommissionBps: true } });
  const rows = tenants.map((tenant) =>
    extraTenant?.id === tenant.id ? { ...tenant, individualCommissionBps: extraTenant.individualBps } : tenant,
  );
  if (extraTenant && !extraTenant.id) rows.push({ id: "neu", individualCommissionBps: extraTenant.individualBps });
  return rows.every((tenant) => globalBps + tenant.individualCommissionBps <= 10000);
}

export async function saveGlobalRate(formData: FormData) {
  await requireRole("ADMIN");
  const bps = parseMinorUnits(String(formData.get("rate") ?? ""));
  if (bps === null || bps > 10000) redirect(withNotice("/admin", "Der globale Satz ist ungültig.", "fehler"));
  if (!(await ratesStayInBounds(bps))) {
    redirect(withNotice("/admin", "Zusammen mit einem individuellen Satz wären es mehr als 100 Prozent.", "fehler"));
  }
  await prisma.platformSettings.upsert({ where: { id: 1 }, create: { id: 1, globalCommissionBps: bps }, update: { globalCommissionBps: bps } });
  redirect(withNotice("/admin", "Globaler Satz gespeichert.", "ok"));
}

export async function createTenant(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  const industryKey = String(formData.get("industryKey") ?? "");
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const latitude = Number(String(formData.get("latitude") ?? "").replace(",", "."));
  const longitude = Number(String(formData.get("longitude") ?? "").replace(",", "."));
  const industry = findIndustry(industryKey);
  if (!industry) redirect(withNotice("/admin/mandanten/neu", "Die Branche ist unbekannt.", "fehler"));
  if (name.length < 2 || ownerName.length < 2) redirect(withNotice("/admin/mandanten/neu", "Name und Inhaber brauchen einen Text.", "fehler"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(withNotice("/admin/mandanten/neu", "Die E-Mail ist ungültig.", "fehler"));
  if (password.length < 8) redirect(withNotice("/admin/mandanten/neu", "Das Passwort braucht mindestens 8 Zeichen.", "fehler"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    redirect(withNotice("/admin/mandanten/neu", "Breite und Länge sind ungültig.", "fehler"));
  }
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) redirect(withNotice("/admin/mandanten/neu", "Diese E-Mail ist schon vergeben.", "fehler"));
  let slug = slugify(name) || "laden";
  if (await prisma.tenant.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      industryKey,
      approved: false,
      openingHours: String(formData.get("openingHours") ?? "").trim() || "noch nicht gepflegt",
      story: String(formData.get("story") ?? "").trim() || "noch nicht gepflegt",
      pickupLabel: String(formData.get("pickupLabel") ?? "").trim() || "Abholung",
      pickupAddress: String(formData.get("pickupAddress") ?? "").trim() || "noch nicht gepflegt",
      latitude,
      longitude,
    },
  });
  await prisma.user.create({
    data: { name: ownerName, email, passwordHash: hashPassword(password), role: "OWNER", tenantId: tenant.id },
  });
  revalidatePath("/");
  redirect(withNotice(`/admin/mandanten/${tenant.id}`, "Mandant angelegt. Der Laden ist noch nicht sichtbar.", "ok"));
}

export async function updateTenant(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const back = `/admin/mandanten/${id}`;
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) redirect("/admin/mandanten");
  const individualBps = parseMinorUnits(String(formData.get("individual") ?? ""));
  const cadence = String(formData.get("cadence") ?? "");
  const latitude = Number(String(formData.get("latitude") ?? "").replace(",", "."));
  const longitude = Number(String(formData.get("longitude") ?? "").replace(",", "."));
  if (individualBps === null || individualBps > 10000) redirect(withNotice(back, "Der individuelle Satz ist ungültig.", "fehler"));
  if (cadence !== "WEEKLY" && cadence !== "MONTHLY") redirect(withNotice(back, "Der Auszahlungsrhythmus ist unbekannt.", "fehler"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) redirect(withNotice(back, "Breite und Länge sind ungültig.", "fehler"));
  const settings = await prisma.platformSettings.findUnique({ where: { id: 1 } });
  if (!(await ratesStayInBounds(settings?.globalCommissionBps ?? 0, { id, individualBps }))) {
    redirect(withNotice(back, "Globaler und individueller Satz zusammen dürfen 100 Prozent nicht übersteigen.", "fehler"));
  }
  await prisma.tenant.update({
    where: { id },
    data: {
      approved: formData.get("approved") === "on",
      individualCommissionBps: individualBps,
      payoutCadence: cadence,
      latitude,
      longitude,
      openingHours: String(formData.get("openingHours") ?? ""),
      story: String(formData.get("story") ?? ""),
      pickupLabel: String(formData.get("pickupLabel") ?? ""),
      pickupAddress: String(formData.get("pickupAddress") ?? ""),
    },
  });
  revalidatePath("/");
  revalidatePath(`/laden/${tenant.slug}`);
  redirect(withNotice(back, "Mandant gespeichert.", "ok"));
}

export async function saveShipping(formData: FormData) {
  await requireRole("ADMIN");
  const zoneName = String(formData.get("newZone") ?? "").trim();
  if (zoneName) {
    let key = slugify(zoneName);
    if (!key) redirect(withNotice("/admin/versand", "Die Zone braucht einen Namen.", "fehler"));
    if (await prisma.deliveryZone.findUnique({ where: { key } })) key = `${key}-${Date.now().toString(36)}`;
    const sort = (await prisma.deliveryZone.count()) + 1;
    await prisma.deliveryZone.create({ data: { key, name: zoneName, sort } });
  }
  const zones = await prisma.deliveryZone.findMany();
  for (const zone of zones) {
    const name = String(formData.get(`name:${zone.id}`) ?? zone.name).trim();
    if (name) await prisma.deliveryZone.update({ where: { id: zone.id }, data: { name } });
    for (const method of ["OWN_DELIVERY", "CARRIER", "REGIONAL"] as const) {
      const raw = String(formData.get(`price:${zone.id}:${method}`) ?? "").trim();
      if (!raw) {
        await prisma.shippingPrice.deleteMany({ where: { zoneId: zone.id, method } });
        continue;
      }
      if (!isPricedMethod(method)) continue;
      const priceCents = parseMinorUnits(raw);
      if (priceCents === null) redirect(withNotice("/admin/versand", "Ein Versandpreis ist ungültig.", "fehler"));
      await prisma.shippingPrice.upsert({
        where: { zoneId_method: { zoneId: zone.id, method } },
        create: { zoneId: zone.id, method, priceCents },
        update: { priceCents },
      });
    }
  }
  redirect(withNotice("/admin/versand", "Lieferzonen und Preise gespeichert.", "ok"));
}
