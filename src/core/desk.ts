import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { isPricedMethod, METHOD_LABEL, PRICED_METHODS } from "./fulfillment";
import { findIndustry, listIndustries } from "./industries/registry";
import { CSV_BASE } from "./csv";
import { planImport } from "./import-products";
import { CADENCE_LABEL } from "./labels";
import { formatPercent, minorToInput, parseMinorUnits } from "./money";
import { PILOT_CENTER } from "./region";
import { makeSku, parseStock, slugify } from "./text";
import { hashPassword } from "./password";
import { readAttributes } from "./industries/types";
import { summarize } from "./commission";

type Result = { ok: true; message: string; href?: string } | { ok: false; message: string };

async function ratesStayInBounds(globalBps: number, extraTenant?: { id?: string; individualBps: number }) {
  const tenants = await prisma.tenant.findMany({ select: { id: true, individualCommissionBps: true } });
  const rows = tenants.map((tenant) =>
    extraTenant?.id === tenant.id ? { ...tenant, individualCommissionBps: extraTenant.individualBps } : tenant,
  );
  if (extraTenant && !extraTenant.id) rows.push({ id: "neu", individualCommissionBps: extraTenant.individualBps });
  return rows.every((tenant) => globalBps + tenant.individualCommissionBps <= 10000);
}

export async function adminOverview() {
  const [settings, tenants, parts, recent] = await Promise.all([
    prisma.platformSettings.findUnique({ where: { id: 1 } }),
    prisma.tenant.findMany({ orderBy: { name: "asc" } }),
    prisma.orderPart.findMany({ where: { order: { status: "PLACED" } }, include: { tenant: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const globalBps = settings?.globalCommissionBps ?? 0;
  const summary = summarize(
    parts.map((part) => ({
      tenantId: part.tenantId,
      tenantName: part.tenant.name,
      goodsCents: part.goodsCents,
      commissionCents: part.commissionCents,
      payoutCents: part.payoutCents,
    })),
  );
  const byTenant = new Map(summary.rows.map((row) => [row.tenantId, row]));
  return {
    globalBps,
    rateInput: minorToInput(globalBps),
    rateLabel: formatPercent(globalBps),
    tenants: tenants.map((tenant) => {
      const row = byTenant.get(tenant.id);
      return {
        id: tenant.id,
        name: tenant.name,
        goodsCents: row?.goodsCents ?? 0,
        commissionCents: row?.commissionCents ?? 0,
        payoutCents: row?.payoutCents ?? 0,
      };
    }),
    totals: summary.totals,
    recent: recent.map((order) => ({ number: order.number, goodsCents: order.goodsCents })),
  };
}

export async function saveGlobalRate(rate: string): Promise<Result> {
  const bps = parseMinorUnits(rate);
  if (bps === null || bps > 10000) return { ok: false, message: "Der globale Satz ist ungültig." };
  if (!(await ratesStayInBounds(bps))) {
    return { ok: false, message: "Zusammen mit einem individuellen Satz wären es mehr als 100 Prozent." };
  }
  await prisma.platformSettings.upsert({
    where: { id: 1 },
    create: { id: 1, globalCommissionBps: bps },
    update: { globalCommissionBps: bps },
  });
  return { ok: true, message: "Globaler Satz gespeichert.", href: "/admin" };
}

export async function listTenants() {
  const [tenants, settings] = await Promise.all([
    prisma.tenant.findMany({ orderBy: { name: "asc" }, include: { owner: true } }),
    prisma.platformSettings.findUnique({ where: { id: 1 } }),
  ]);
  const globalBps = settings?.globalCommissionBps ?? 0;
  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    email: tenant.owner?.email ?? "",
    industry: findIndustry(tenant.industryKey)?.label ?? tenant.industryKey,
    approved: tenant.approved,
    rateLabel: formatPercent(globalBps + tenant.individualCommissionBps),
    cadence: CADENCE_LABEL[tenant.payoutCadence],
  }));
}

export function industryChoices() {
  return listIndustries().map((industry) => ({ key: industry.key, label: industry.label }));
}

export async function createTenant(input: {
  name: string;
  industryKey: string;
  ownerName: string;
  email: string;
  password: string;
  openingHours: string;
  pickupLabel: string;
  pickupAddress: string;
  story: string;
}): Promise<Result & { id?: string }> {
  const name = input.name.trim();
  const ownerName = input.ownerName.trim();
  const email = input.email.trim().toLowerCase();
  const industry = findIndustry(input.industryKey);
  if (!industry) return { ok: false, message: "Die Branche ist unbekannt." };
  if (name.length < 2 || ownerName.length < 2) return { ok: false, message: "Name und Inhaber brauchen einen Text." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Die E-Mail ist ungültig." };
  if (input.password.length < 8) return { ok: false, message: "Das Passwort braucht mindestens 8 Zeichen." };
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) return { ok: false, message: "Diese E-Mail ist schon vergeben." };
  let slug = slugify(name) || "laden";
  if (await prisma.tenant.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      industryKey: industry.key,
      approved: false,
      openingHours: input.openingHours.trim() || "noch nicht gepflegt",
      story: input.story.trim() || "noch nicht gepflegt",
      pickupLabel: input.pickupLabel.trim() || "Abholung",
      pickupAddress: input.pickupAddress.trim() || "noch nicht gepflegt",
      latitude: PILOT_CENTER.lat,
      longitude: PILOT_CENTER.lng,
    },
  });
  await prisma.user.create({
    data: { name: ownerName, email, passwordHash: hashPassword(input.password), role: "OWNER", tenantId: tenant.id },
  });
  return { ok: true, message: "Mandant angelegt. Der Laden ist noch nicht sichtbar.", href: `/admin/mandanten/${tenant.id}`, id: tenant.id };
}

export async function loadTenant(id: string) {
  const [tenant, settings] = await Promise.all([
    prisma.tenant.findUnique({ where: { id }, include: { owner: true } }),
    prisma.platformSettings.findUnique({ where: { id: 1 } }),
  ]);
  if (!tenant) return null;
  const globalBps = settings?.globalCommissionBps ?? 0;
  return {
    id: tenant.id,
    name: tenant.name,
    industry: findIndustry(tenant.industryKey)?.label ?? tenant.industryKey,
    ownerName: tenant.owner?.name ?? "",
    ownerEmail: tenant.owner?.email ?? "",
    approved: tenant.approved,
    individualInput: minorToInput(tenant.individualCommissionBps),
    cadence: tenant.payoutCadence,
    rateLabel: formatPercent(globalBps + tenant.individualCommissionBps),
    stripeAccountId: tenant.stripeAccountId,
    openingHours: tenant.openingHours,
    pickupLabel: tenant.pickupLabel,
    pickupAddress: tenant.pickupAddress,
    story: tenant.story,
  };
}

export async function updateTenant(input: {
  id: string;
  approved: boolean;
  individual: string;
  cadence: string;
  openingHours: string;
  story: string;
  pickupLabel: string;
  pickupAddress: string;
}): Promise<Result> {
  const tenant = await prisma.tenant.findUnique({ where: { id: input.id } });
  if (!tenant) return { ok: false, message: "Der Mandant fehlt." };
  const individualBps = parseMinorUnits(input.individual);
  if (individualBps === null || individualBps > 10000) return { ok: false, message: "Der individuelle Satz ist ungültig." };
  if (input.cadence !== "WEEKLY" && input.cadence !== "MONTHLY") return { ok: false, message: "Der Auszahlungsrhythmus ist unbekannt." };
  const settings = await prisma.platformSettings.findUnique({ where: { id: 1 } });
  if (!(await ratesStayInBounds(settings?.globalCommissionBps ?? 0, { id: tenant.id, individualBps }))) {
    return { ok: false, message: "Globaler und individueller Satz zusammen dürfen 100 Prozent nicht übersteigen." };
  }
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      approved: input.approved,
      individualCommissionBps: individualBps,
      payoutCadence: input.cadence,
      openingHours: input.openingHours,
      story: input.story,
      pickupLabel: input.pickupLabel,
      pickupAddress: input.pickupAddress,
    },
  });
  return { ok: true, message: "Mandant gespeichert.", href: `/admin/mandanten/${tenant.id}` };
}

export async function shippingDesk() {
  const zones = await prisma.deliveryZone.findMany({ orderBy: { sort: "asc" }, include: { prices: true } });
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    prices: PRICED_METHODS.map((method) => {
      const price = zone.prices.find((item) => item.method === method);
      return { method, label: METHOD_LABEL[method], input: price ? minorToInput(price.priceCents) : "" };
    }),
  }));
}

export async function saveShipping(input: { newZone: string; fields: Record<string, string> }): Promise<Result> {
  const zoneName = input.newZone.trim();
  if (zoneName) {
    let key = slugify(zoneName);
    if (!key) return { ok: false, message: "Die Zone braucht einen Namen." };
    if (await prisma.deliveryZone.findUnique({ where: { key } })) key = `${key}-${Date.now().toString(36)}`;
    const sort = (await prisma.deliveryZone.count()) + 1;
    await prisma.deliveryZone.create({ data: { key, name: zoneName, sort } });
  }
  const zones = await prisma.deliveryZone.findMany();
  for (const zone of zones) {
    const name = (input.fields[`name:${zone.id}`] ?? zone.name).trim();
    if (name) await prisma.deliveryZone.update({ where: { id: zone.id }, data: { name } });
    for (const method of PRICED_METHODS) {
      const raw = (input.fields[`price:${zone.id}:${method}`] ?? "").trim();
      if (!raw) {
        await prisma.shippingPrice.deleteMany({ where: { zoneId: zone.id, method } });
        continue;
      }
      const priceCents = parseMinorUnits(raw);
      if (priceCents === null) return { ok: false, message: "Ein Versandpreis ist ungültig." };
      await prisma.shippingPrice.upsert({
        where: { zoneId_method: { zoneId: zone.id, method } },
        create: { zoneId: zone.id, method, priceCents },
        update: { priceCents },
      });
    }
  }
  return { ok: true, message: "Lieferzonen und Preise gespeichert.", href: "/admin/versand" };
}

async function ownerContext(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { tenant: true } });
  if (!user || user.role !== "OWNER" || !user.tenant) return null;
  const industry = findIndustry(user.tenant.industryKey);
  if (!industry) return null;
  return { user, tenant: user.tenant, industry };
}

export async function ownerHome(userId: string) {
  const context = await ownerContext(userId);
  if (!context) return null;
  const { tenant, industry } = context;
  const [products, parts] = await Promise.all([
    prisma.product.findMany({ where: { tenantId: tenant.id }, include: { variants: true }, orderBy: { name: "asc" } }),
    prisma.orderPart.findMany({
      where: { tenantId: tenant.id },
      include: { order: true },
      orderBy: { order: { createdAt: "desc" } },
      take: 8,
    }),
  ]);
  return {
    name: tenant.name,
    slug: tenant.slug,
    approved: tenant.approved,
    industry: industry.label,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      variants: product.variants.length,
      stock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
    })),
    orders: parts.map((part) => ({
      number: part.order.number,
      when: part.order.createdAt.toISOString(),
      email: part.order.email,
      method: METHOD_LABEL[part.order.method],
      goodsCents: part.goodsCents,
    })),
  };
}

export async function ownerProfile(userId: string) {
  const context = await ownerContext(userId);
  if (!context) return null;
  const { tenant } = context;
  return {
    openingHours: tenant.openingHours,
    pickupLabel: tenant.pickupLabel,
    pickupAddress: tenant.pickupAddress,
    story: tenant.story,
  };
}

export async function saveShopProfile(userId: string, input: { openingHours: string; story: string; pickupLabel: string; pickupAddress: string }): Promise<Result> {
  const context = await ownerContext(userId);
  if (!context) return { ok: false, message: "Diesem Konto ist kein Laden zugeordnet." };
  const openingHours = input.openingHours.trim();
  const story = input.story.trim();
  const pickupLabel = input.pickupLabel.trim();
  const pickupAddress = input.pickupAddress.trim();
  if (!openingHours || !story || !pickupLabel || !pickupAddress) {
    return { ok: false, message: "Öffnungszeiten, Abholort und Geschichte brauchen einen Text." };
  }
  if (story.length > 800) return { ok: false, message: "Die Geschichte ist zu lang." };
  await prisma.tenant.update({ where: { id: context.tenant.id }, data: { openingHours, story, pickupLabel, pickupAddress } });
  return { ok: true, message: "Angaben gespeichert.", href: "/inhaber/laden" };
}

export async function ownerGrants(userId: string) {
  const context = await ownerContext(userId);
  if (!context) return null;
  const [zones, grants] = await Promise.all([
    prisma.deliveryZone.findMany({ orderBy: { sort: "asc" }, include: { prices: true } }),
    prisma.tenantZoneMethod.findMany({ where: { tenantId: context.tenant.id } }),
  ]);
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    methods: PRICED_METHODS.map((method) => ({
      method,
      label: METHOD_LABEL[method],
      priceCents: zone.prices.find((item) => item.method === method)?.priceCents ?? null,
      checked: grants.some((grant) => grant.zoneId === zone.id && grant.method === method),
    })),
  }));
}

export async function saveGrants(userId: string, grants: string[]): Promise<Result> {
  const context = await ownerContext(userId);
  if (!context) return { ok: false, message: "Diesem Konto ist kein Laden zugeordnet." };
  const zones = await prisma.deliveryZone.findMany({ select: { id: true } });
  const zoneIds = new Set(zones.map((zone) => zone.id));
  const data = grants.flatMap((value) => {
    const [zoneId, method] = value.split(":");
    if (!zoneId || !method || !zoneIds.has(zoneId) || !isPricedMethod(method)) return [];
    return [{ tenantId: context.tenant.id, zoneId, method }];
  });
  await prisma.$transaction([
    prisma.tenantZoneMethod.deleteMany({ where: { tenantId: context.tenant.id } }),
    prisma.tenantZoneMethod.createMany({ data }),
  ]);
  return { ok: true, message: "Versandwege gespeichert. Die Preise setzt die Verwaltung.", href: "/inhaber/versand" };
}

export async function productForm(userId: string, productId?: string) {
  const context = await ownerContext(userId);
  if (!context) return null;
  const product = productId
    ? await prisma.product.findFirst({
        where: { id: productId, tenantId: context.tenant.id },
        include: { variants: { orderBy: { label: "asc" } } },
      })
    : null;
  if (productId && !product) return null;
  return {
    industry: {
      label: context.industry.label,
      categories: context.industry.categories,
      fields: context.industry.fields,
    },
    product: product
      ? {
          id: product.id,
          name: product.name,
          description: product.description,
          categoryKey: product.categoryKey,
          axisLabel: product.axisLabel,
          attributes: readAttributes(product.attributes),
          variants: product.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            priceCents: variant.priceCents,
            stock: variant.stock,
          })),
        }
      : null,
  };
}

export async function saveProduct(
  userId: string,
  input: {
    productId: string;
    name: string;
    description: string;
    categoryKey: string;
    axis: string;
    attributes: Record<string, unknown>;
    variants: { id: string; label: string; price: string; stock: string; remove: boolean }[];
  },
): Promise<Result> {
  const context = await ownerContext(userId);
  if (!context) return { ok: false, message: "Diesem Konto ist kein Laden zugeordnet." };
  const { tenant, industry } = context;
  const name = input.name.trim();
  const categoryKey = input.categoryKey;
  const axis = input.axis.trim();
  if (name.length < 2) return { ok: false, message: "Bitte einen Namen angeben." };
  if (!industry.categories.some((category) => category.key === categoryKey)) {
    return { ok: false, message: "Die Kategorie gehört nicht zu dieser Branche." };
  }
  const checked = industry.validate(input.attributes);
  if (!checked.ok) return { ok: false, message: checked.errors.join(" ") };
  const rows: { id: string; label: string; priceCents: number; stock: number }[] = [];
  for (const variant of input.variants) {
    if (variant.id && variant.remove) continue;
    const label = variant.label.trim();
    const priceRaw = variant.price.trim();
    const stockRaw = variant.stock.trim();
    if (!label && !priceRaw && !stockRaw) continue;
    const priceCents = parseMinorUnits(priceRaw);
    const stock = parseStock(stockRaw);
    if (priceCents === null || stock === null) return { ok: false, message: "Preis oder Bestand ist ungültig." };
    rows.push({ id: variant.id, label, priceCents, stock });
  }
  if (rows.length === 0) return { ok: false, message: "Bitte mindestens eine Variante mit Preis und Bestand angeben." };
  if (rows.length > 1 && !axis) return { ok: false, message: "Mehrere Varianten brauchen eine Achse." };
  if (rows.length === 1 && !axis && !rows[0].label) rows[0].label = "Standard";
  if (rows.some((row) => !row.label)) return { ok: false, message: "Jede Variante braucht eine Bezeichnung." };
  if (new Set(rows.map((row) => row.label)).size !== rows.length) {
    return { ok: false, message: "Die Bezeichnungen der Varianten müssen sich unterscheiden." };
  }
  try {
    await prisma.$transaction(async (tx) => {
      for (const variant of input.variants) {
        if (!variant.id || !variant.remove) continue;
        const current = await tx.variant.findUnique({ where: { id: variant.id }, include: { product: true } });
        if (!current || current.product.tenantId !== tenant.id) continue;
        const used = await tx.orderLine.count({ where: { variantId: variant.id } });
        if (used > 0) throw new Error("Eine bestellte Variante bleibt im Sortiment.");
        await tx.variant.delete({ where: { id: variant.id } });
      }
      const existing = input.productId ? await tx.product.findFirst({ where: { id: input.productId, tenantId: tenant.id } }) : null;
      if (input.productId && !existing) throw new Error("Das Produkt gehört zu diesem Laden nicht.");
      const product =
        existing ??
        (await tx.product.create({
          data: {
            tenantId: tenant.id,
            importKey: await freeKey(tx, tenant.id, slugify(name) || "produkt"),
            name,
            description: input.description.trim(),
            categoryKey,
            axisLabel: axis || null,
            attributes: checked.value,
          },
        }));
      if (existing) {
        await tx.product.update({
          where: { id: existing.id },
          data: { name, description: input.description.trim(), categoryKey, axisLabel: axis || null, attributes: checked.value },
        });
      }
      for (const row of rows) {
        const sku = makeSku(tenant.slug, product.importKey, row.label);
        if (row.id) {
          const variant = await tx.variant.findFirst({ where: { id: row.id, productId: product.id } });
          if (!variant) throw new Error("Eine Variante wurde nicht gefunden.");
          await tx.variant.update({ where: { id: row.id }, data: { label: row.label, priceCents: row.priceCents, stock: row.stock, sku } });
        } else {
          await tx.variant.create({ data: { productId: product.id, label: row.label, priceCents: row.priceCents, stock: row.stock, sku } });
        }
      }
    });
  } catch (error) {
    let message = "Das Produkt konnte nicht gespeichert werden.";
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") message = "Diese Variante gibt es schon.";
    else if (error instanceof Error && /Sortiment|gehört|gefunden/.test(error.message)) message = error.message;
    return { ok: false, message };
  }
  return { ok: true, message: "Produkt gespeichert.", href: "/inhaber" };
}

async function freeKey(tx: Prisma.TransactionClient, tenantId: string, base: string) {
  let importKey = `manuell-${base}`;
  const clash = await tx.product.findUnique({ where: { tenantId_importKey: { tenantId, importKey } } });
  if (clash) importKey = `${importKey}-${Date.now().toString(36)}`;
  return importKey;
}

export async function importOwnerCsv(userId: string, csv: string) {
  const context = await ownerContext(userId);
  if (!context) return { ok: false as const, message: "Diesem Konto ist kein Laden zugeordnet." };
  const plan = planImport(csv, context.industry);
  let imported = 0;
  for (const item of plan.products) {
    const existing = await prisma.product.findUnique({
      where: { tenantId_importKey: { tenantId: context.tenant.id, importKey: item.importKey } },
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
            tenantId: context.tenant.id,
            importKey: item.importKey,
            name: item.name,
            description: item.description,
            categoryKey: item.categoryKey,
            axisLabel: item.axisLabel,
            attributes: item.attributes,
          },
        });
    for (const variant of item.variants) {
      const sku = makeSku(context.tenant.slug, product.importKey, variant.label);
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
  return {
    ok: true as const,
    href: "/inhaber/import",
    report: { imported, acceptedRows: plan.acceptedRows, errors: plan.errors.slice(0, 40) },
  };
}

export function csvTemplate(industryKey: string) {
  const industry = findIndustry(industryKey);
  if (!industry) return null;
  const columns = [...CSV_BASE, ...industry.fields.map((field) => field.key)];
  const example = [
    "beispiel",
    "Beispielprodukt",
    "Kurzbeschreibung",
    industry.categories[0]?.key ?? "",
    "",
    "Standard",
    "3,50",
    "10",
    ...industry.fields.map((field) =>
      field.type === "boolean" ? "nein" : field.type === "select" ? (field.options?.[0]?.value ?? "") : field.type === "tokens" ? (field.options?.[0]?.value ?? "") : "Beispiel",
    ),
  ];
  return { key: industry.key, label: industry.label, columns, example, body: `\uFEFF${columns.join(";")}\n${example.join(";")}\n` };
}
