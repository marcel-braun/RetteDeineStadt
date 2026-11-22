"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPricedMethod } from "@/lib/fulfillment";
import { findIndustry } from "@/lib/industries/registry";
import { planImport } from "@/lib/import-products";
import { parseMinorUnits } from "@/lib/money";
import { makeSku, parseStock, slugify, withNotice } from "@/lib/text";

async function ownerTenant() {
  const user = await requireRole("OWNER");
  if (!user.tenant) redirect(withNotice("/inhaber", "Diesem Konto ist kein Laden zugeordnet.", "fehler"));
  const industry = findIndustry(user.tenant.industryKey);
  if (!industry) redirect(withNotice("/inhaber", "Die Branche dieses Ladens ist unbekannt.", "fehler"));
  return { user, tenant: user.tenant, industry };
}

export async function saveShopProfile(formData: FormData) {
  const { tenant } = await ownerTenant();
  const openingHours = String(formData.get("openingHours") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const pickupLabel = String(formData.get("pickupLabel") ?? "").trim();
  const pickupAddress = String(formData.get("pickupAddress") ?? "").trim();
  if (!openingHours || !story || !pickupLabel || !pickupAddress) {
    redirect(withNotice("/inhaber/laden", "Öffnungszeiten, Abholort und Geschichte brauchen einen Text.", "fehler"));
  }
  if (story.length > 800) redirect(withNotice("/inhaber/laden", "Die Geschichte ist zu lang.", "fehler"));
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { openingHours, story, pickupLabel, pickupAddress },
  });
  revalidatePath(`/laden/${tenant.slug}`);
  redirect(withNotice("/inhaber/laden", "Angaben gespeichert.", "ok"));
}

export async function saveGrants(formData: FormData) {
  const { tenant } = await ownerTenant();
  const zones = await prisma.deliveryZone.findMany({ select: { id: true } });
  const zoneIds = new Set(zones.map((zone) => zone.id));
  const data = formData
    .getAll("grant")
    .map(String)
    .flatMap((value) => {
      const [zoneId, method] = value.split(":");
      if (!zoneId || !method || !zoneIds.has(zoneId) || !isPricedMethod(method)) return [];
      return [{ tenantId: tenant.id, zoneId, method }];
    });
  await prisma.$transaction([
    prisma.tenantZoneMethod.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.tenantZoneMethod.createMany({ data }),
  ]);
  redirect(withNotice("/inhaber/versand", "Versandwege gespeichert. Die Preise setzt die Verwaltung.", "ok"));
}

export async function saveProduct(formData: FormData) {
  const { tenant, industry } = await ownerTenant();
  const productId = String(formData.get("productId") ?? "");
  const back = productId ? `/inhaber/produkte/${productId}` : "/inhaber/produkte/neu";
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryKey = String(formData.get("categoryKey") ?? "");
  const axis = String(formData.get("axis") ?? "").trim();
  if (name.length < 2) redirect(withNotice(back, "Bitte einen Namen angeben.", "fehler"));
  if (!industry.categories.some((category) => category.key === categoryKey)) {
    redirect(withNotice(back, "Die Kategorie gehört nicht zu dieser Branche.", "fehler"));
  }
  const raw: Record<string, unknown> = {};
  for (const field of industry.fields) {
    raw[field.key] = field.type === "boolean" ? formData.get(`attr_${field.key}`) === "on" : String(formData.get(`attr_${field.key}`) ?? "");
  }
  const checked = industry.validate(raw);
  if (!checked.ok) redirect(withNotice(back, checked.errors.join(" "), "fehler"));

  const ids = formData.getAll("variantId").map(String);
  const labels = formData.getAll("variantLabel").map(String);
  const prices = formData.getAll("variantPrice").map(String);
  const stocks = formData.getAll("variantStock").map(String);
  const remove = new Set(formData.getAll("variantRemove").map(String));
  const rows: { id: string; label: string; priceCents: number; stock: number }[] = [];
  for (let index = 0; index < labels.length; index += 1) {
    const id = ids[index] ?? "";
    if (id && remove.has(id)) continue;
    const label = (labels[index] ?? "").trim();
    const priceRaw = (prices[index] ?? "").trim();
    const stockRaw = (stocks[index] ?? "").trim();
    if (!label && !priceRaw && !stockRaw) continue;
    const priceCents = parseMinorUnits(priceRaw);
    const stock = parseStock(stockRaw);
    if (priceCents === null || stock === null) redirect(withNotice(back, "Preis oder Bestand ist ungültig.", "fehler"));
    rows.push({ id, label, priceCents, stock });
  }
  if (rows.length === 0) redirect(withNotice(back, "Bitte mindestens eine Variante mit Preis und Bestand angeben.", "fehler"));
  if (rows.length > 1 && !axis) redirect(withNotice(back, "Mehrere Varianten brauchen eine Achse.", "fehler"));
  if (rows.length === 1 && !axis && !rows[0].label) rows[0].label = "Standard";
  if (rows.some((row) => !row.label)) redirect(withNotice(back, "Jede Variante braucht eine Bezeichnung.", "fehler"));
  if (new Set(rows.map((row) => row.label)).size !== rows.length) {
    redirect(withNotice(back, "Die Bezeichnungen der Varianten müssen sich unterscheiden.", "fehler"));
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const id of remove) {
        const variant = await tx.variant.findUnique({ where: { id }, include: { product: true } });
        if (!variant || variant.product.tenantId !== tenant.id) continue;
        const used = await tx.orderLine.count({ where: { variantId: id } });
        if (used > 0) throw new Error("Eine bestellte Variante bleibt im Sortiment.");
        await tx.variant.delete({ where: { id } });
      }
      const existing = productId ? await tx.product.findFirst({ where: { id: productId, tenantId: tenant.id } }) : null;
      if (productId && !existing) throw new Error("Das Produkt gehört zu diesem Laden nicht.");
      const product =
        existing ??
        (await tx.product.create({
          data: {
            tenantId: tenant.id,
            importKey: await freeKey(tx, tenant.id, slugify(name) || "produkt"),
            name,
            description,
            categoryKey,
            axisLabel: axis || null,
            attributes: checked.value,
          },
        }));
      if (existing) {
        await tx.product.update({
          where: { id: existing.id },
          data: { name, description, categoryKey, axisLabel: axis || null, attributes: checked.value },
        });
      }
      for (const row of rows) {
        const sku = makeSku(tenant.slug, product.importKey, row.label);
        if (row.id) {
          const variant = await tx.variant.findFirst({ where: { id: row.id, productId: product.id } });
          if (!variant) throw new Error("Eine Variante wurde nicht gefunden.");
          await tx.variant.update({
            where: { id: row.id },
            data: { label: row.label, priceCents: row.priceCents, stock: row.stock, sku },
          });
        } else {
          await tx.variant.create({
            data: { productId: product.id, label: row.label, priceCents: row.priceCents, stock: row.stock, sku },
          });
        }
      }
    });
  } catch (error) {
    let message = "Das Produkt konnte nicht gespeichert werden.";
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      message = "Diese Variante gibt es schon.";
    } else if (error instanceof Error && /Sortiment|gehört|gefunden/.test(error.message)) {
      message = error.message;
    }
    redirect(withNotice(back, message, "fehler"));
  }
  revalidatePath(`/laden/${tenant.slug}`);
  redirect(withNotice("/inhaber", "Produkt gespeichert.", "ok"));
}

async function freeKey(tx: Prisma.TransactionClient, tenantId: string, base: string) {
  let importKey = `manuell-${base}`;
  const clash = await tx.product.findUnique({ where: { tenantId_importKey: { tenantId, importKey } } });
  if (clash) importKey = `${importKey}-${Date.now().toString(36)}`;
  return importKey;
}

export async function importCsv(formData: FormData) {
  const { tenant, industry } = await ownerTenant();
  const file = formData.get("datei");
  if (!(file instanceof File) || file.size === 0) {
    redirect(withNotice("/inhaber/import", "Bitte eine CSV-Datei wählen.", "fehler"));
  }
  if (file.size > 1_000_000) redirect(withNotice("/inhaber/import", "Die Datei ist zu groß.", "fehler"));
  const plan = planImport(await file.text(), industry);
  let imported = 0;
  for (const item of plan.products) {
    const existing = await prisma.product.findUnique({
      where: { tenantId_importKey: { tenantId: tenant.id, importKey: item.importKey } },
      include: { variants: true },
    });
    const product = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            description: item.description,
            categoryKey: item.categoryKey,
            axisLabel: item.axisLabel,
            attributes: item.attributes,
          },
        })
      : await prisma.product.create({
          data: {
            tenantId: tenant.id,
            importKey: item.importKey,
            name: item.name,
            description: item.description,
            categoryKey: item.categoryKey,
            axisLabel: item.axisLabel,
            attributes: item.attributes,
          },
        });
    for (const variant of item.variants) {
      const sku = makeSku(tenant.slug, product.importKey, variant.label);
      const current = existing?.variants.find((entry) => entry.label === variant.label);
      if (current) {
        await prisma.variant.update({
          where: { id: current.id },
          data: { priceCents: variant.priceCents, stock: variant.stock, sku, label: variant.label },
        });
      } else {
        await prisma.variant.create({
          data: { productId: product.id, label: variant.label, priceCents: variant.priceCents, stock: variant.stock, sku },
        });
      }
    }
    imported += 1;
  }
  const jar = await cookies();
  jar.set(
    "rds_import",
    JSON.stringify({ imported, acceptedRows: plan.acceptedRows, errors: plan.errors.slice(0, 40) }),
    { httpOnly: true, sameSite: "lax", path: "/inhaber/import", maxAge: 180 },
  );
  revalidatePath(`/laden/${tenant.slug}`);
  redirect("/inhaber/import");
}
