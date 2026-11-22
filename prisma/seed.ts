import { Prisma, PrismaClient, type FulfillmentMethod, type PayoutCadence } from "@prisma/client";
import { findIndustry } from "../src/lib/industries/registry";
import type { Attributes } from "../src/lib/industries/types";
import { hashPassword } from "../src/lib/password";
import { makeSku } from "../src/lib/text";

const prisma = new PrismaClient();
const ownerPassword = hashPassword("pilot-inhaber");

type VariantSeed = { label: string; priceCents: number; stock: number };
type ProductSeed = {
  importKey: string;
  name: string;
  description: string;
  categoryKey: string;
  axisLabel?: string;
  attributes: Attributes;
  variants: VariantSeed[];
};
type ShopSeed = {
  slug: string;
  name: string;
  industryKey: string;
  email: string;
  ownerName: string;
  approved: boolean;
  cadence: PayoutCadence;
  individualBps: number;
  lat: number;
  lng: number;
  pickupLabel: string;
  pickupAddress: string;
  openingHours: string;
  story: string;
  grants: [string, FulfillmentMethod][];
  products: ProductSeed[];
};

const shops: ShopSeed[] = [
  {
    slug: "sonnenacker",
    name: "Hofladen Sonnenacker",
    industryKey: "lebensmittel",
    email: "hofladen@pilot.local",
    ownerName: "Sonnenacker",
    approved: true,
    cadence: "WEEKLY",
    individualBps: 0,
    lat: 49.178,
    lng: 10.318,
    pickupLabel: "Hofeinfahrt",
    pickupAddress: "Auenweg 4",
    openingHours: "Dienstag bis Freitag, 9–18 Uhr\nSamstag, 8–13 Uhr",
    story: "Seit drei Generationen kommt das Gemüse vom Acker vor dem Ort. Was morgens geerntet wird, liegt mittags im Korb.",
    grants: [
      ["ortskern", "OWN_DELIVERY"],
      ["ortskern", "REGIONAL"],
      ["nahes-umland", "OWN_DELIVERY"],
      ["nahes-umland", "REGIONAL"],
      ["weiteres-umland", "OWN_DELIVERY"],
      ["weiteres-umland", "REGIONAL"],
    ],
    products: [
      {
        importKey: "eier",
        name: "Eier vom Hof",
        description: "Vom Stall hinter der Scheune, ungewaschen.",
        categoryKey: "milch-ei",
        axisLabel: "Packung",
        attributes: { herkunft: "eigener Stall", einheit: "Stück", gekuehlt: true },
        variants: [
          { label: "6 Stück", priceCents: 280, stock: 40 },
          { label: "10 Stück", priceCents: 420, stock: 24 },
        ],
      },
      {
        importKey: "kartoffeln",
        name: "Kartoffeln festkochend",
        description: "Vorige Woche gerodet.",
        categoryKey: "gemuese",
        attributes: { herkunft: "Acker am Ort", einheit: "2 kg", gekuehlt: false },
        variants: [{ label: "2 kg", priceCents: 340, stock: 30 }],
      },
    ],
  },
  {
    slug: "baeckerei-krume",
    name: "Bäckerei Krume",
    industryKey: "baeckerei",
    email: "baeckerei@pilot.local",
    ownerName: "Krume",
    approved: true,
    cadence: "WEEKLY",
    individualBps: 0,
    lat: 49.166,
    lng: 10.338,
    pickupLabel: "Ladentür",
    pickupAddress: "Kirchgasse 2",
    openingHours: "Dienstag bis Freitag, 6–13 Uhr\nSamstag, 6–12 Uhr",
    story: "Der Ofen geht um vier an. Das Mehl kommt von der Mühle im Nachbarort.",
    grants: [
      ["ortskern", "OWN_DELIVERY"],
      ["nahes-umland", "OWN_DELIVERY"],
      ["ortskern", "REGIONAL"],
      ["nahes-umland", "REGIONAL"],
      ["weiteres-umland", "REGIONAL"],
    ],
    products: [
      {
        importKey: "roggenbrot",
        name: "Roggenbrot",
        description: "Sauerteig, ein Laib.",
        categoryKey: "brot",
        attributes: { gewicht: "1 kg", hefefrei: false },
        variants: [{ label: "Laib", priceCents: 420, stock: 18 }],
      },
      {
        importKey: "haferfladen",
        name: "Haferfladen",
        description: "Ohne Hefe, aus dem Nachmittagsofen.",
        categoryKey: "kleingebaeck",
        attributes: { gewicht: "80 g", hefefrei: true },
        variants: [{ label: "Stück", priceCents: 180, stock: 30 }],
      },
    ],
  },
  {
    slug: "metzgerei-holm",
    name: "Metzgerei Holm",
    industryKey: "metzgerei",
    email: "metzgerei@pilot.local",
    ownerName: "Holm",
    approved: true,
    cadence: "MONTHLY",
    individualBps: 200,
    lat: 49.16,
    lng: 10.318,
    pickupLabel: "Theke",
    pickupAddress: "Markt 7",
    openingHours: "Dienstag bis Freitag, 8–18 Uhr\nSamstag, 8–12 Uhr",
    story: "Schlachtung in der Region, Wurst nach Hausrezept. Die Theke ist klein, die Schlange am Samstag auch.",
    grants: [
      ["ortskern", "OWN_DELIVERY"],
      ["ortskern", "CARRIER"],
      ["nahes-umland", "CARRIER"],
      ["weiteres-umland", "CARRIER"],
      ["ortskern", "REGIONAL"],
      ["nahes-umland", "REGIONAL"],
      ["weiteres-umland", "REGIONAL"],
    ],
    products: [
      {
        importKey: "leberwurst",
        name: "Leberwurst",
        description: "Im Naturdarm, grob.",
        categoryKey: "wurst",
        axisLabel: "Gewicht",
        attributes: { tierart: "gemischt", gekuehlt: true },
        variants: [
          { label: "200 g", priceCents: 450, stock: 20 },
          { label: "400 g", priceCents: 800, stock: 16 },
        ],
      },
      {
        importKey: "sonntagsbraten",
        name: "Sonntagsbraten",
        description: "Rind, am Stück, zum Braten.",
        categoryKey: "frischfleisch",
        attributes: { tierart: "rind", gekuehlt: true },
        variants: [{ label: "Standard", priceCents: 4000, stock: 8 }],
      },
    ],
  },
  {
    slug: "getraenke-quelle",
    name: "Getränke Quelle",
    industryKey: "getraenke",
    email: "getraenke@pilot.local",
    ownerName: "Quelle",
    approved: true,
    cadence: "WEEKLY",
    individualBps: 0,
    lat: 49.174,
    lng: 10.348,
    pickupLabel: "Hof",
    pickupAddress: "Brunnenweg 11",
    openingHours: "Mittwoch bis Freitag, 14–19 Uhr\nSamstag, 9–14 Uhr",
    story: "Saft von den Streuobstwiesen der Umgebung und ein helles Bier aus der Nachbarortschaft.",
    grants: [
      ["ortskern", "CARRIER"],
      ["nahes-umland", "CARRIER"],
      ["weiteres-umland", "CARRIER"],
      ["ortskern", "REGIONAL"],
      ["nahes-umland", "REGIONAL"],
    ],
    products: [
      {
        importKey: "apfelsaft",
        name: "Apfelsaft",
        description: "Naturtrüb, aus der letzten Lese.",
        categoryKey: "saft",
        axisLabel: "Flasche",
        attributes: { inhalt: "Glasflasche", alkoholfrei: true },
        variants: [
          { label: "0,75 l", priceCents: 240, stock: 24 },
          { label: "1 l", priceCents: 310, stock: 18 },
        ],
      },
      {
        importKey: "helles",
        name: "Helles",
        description: "Unfiltriert.",
        categoryKey: "wein-bier",
        attributes: { inhalt: "0,5 l", alkoholfrei: false },
        variants: [{ label: "Flasche", priceCents: 180, stock: 40 }],
      },
    ],
  },
  {
    slug: "blumenstube-linde",
    name: "Blumenstube Linde",
    industryKey: "blumen",
    email: "blumen@pilot.local",
    ownerName: "Linde",
    approved: true,
    cadence: "WEEKLY",
    individualBps: 0,
    lat: 49.155,
    lng: 10.342,
    pickupLabel: "Stube",
    pickupAddress: "Lindenplatz 1",
    openingHours: "Dienstag bis Freitag, 9–17 Uhr\nSamstag, 9–13 Uhr",
    story: "Sträuße aus dem Garten hinter dem Haus und Kräuter im Topf, die den Winter überstehen.",
    grants: [
      ["ortskern", "OWN_DELIVERY"],
      ["nahes-umland", "OWN_DELIVERY"],
      ["weiteres-umland", "OWN_DELIVERY"],
      ["ortskern", "REGIONAL"],
      ["nahes-umland", "REGIONAL"],
      ["weiteres-umland", "REGIONAL"],
    ],
    products: [
      {
        importKey: "wiesenstrauss",
        name: "Wiesenstrauß",
        description: "Was gerade blüht.",
        categoryKey: "straeusse",
        attributes: { haltbarkeit: "etwa 4 Tage", saison: true },
        variants: [{ label: "Strauß", priceCents: 1450, stock: 10 }],
      },
      {
        importKey: "rosmarin",
        name: "Rosmarin im Topf",
        description: "Für die Fensterbank.",
        categoryKey: "topf",
        attributes: { haltbarkeit: "mehrere Monate", saison: false },
        variants: [{ label: "Topf", priceCents: 650, stock: 14 }],
      },
    ],
  },
  {
    slug: "werkstatt-am-bach",
    name: "Werkstatt Am Bach",
    industryKey: "handwerk",
    email: "werkstatt@pilot.local",
    ownerName: "Am Bach",
    approved: true,
    cadence: "WEEKLY",
    individualBps: 0,
    lat: 49.186,
    lng: 10.348,
    pickupLabel: "Werkstatt",
    pickupAddress: "Bachgasse 9",
    openingHours: "Donnerstag und Freitag, 15–19 Uhr\nSamstag, 10–14 Uhr",
    story: "Becher und Beutel aus der Werkstatt am Bach. Jedes Stück trägt die Spur der Hand, die es gemacht hat.",
    grants: [
      ["ortskern", "CARRIER"],
      ["nahes-umland", "CARRIER"],
      ["weiteres-umland", "CARRIER"],
      ["ortskern", "REGIONAL"],
      ["nahes-umland", "REGIONAL"],
      ["weiteres-umland", "REGIONAL"],
    ],
    products: [
      {
        importKey: "becher",
        name: "Becher",
        description: "Steinzeug, gespült.",
        categoryKey: "keramik",
        axisLabel: "Glasur",
        attributes: { material: "Steinzeug", unikat: true },
        variants: [
          { label: "Blau", priceCents: 2200, stock: 6 },
          { label: "Sand", priceCents: 2200, stock: 6 },
        ],
      },
      {
        importKey: "leinenbeutel",
        name: "Leinenbeutel",
        description: "Genäht, ungefärbt.",
        categoryKey: "textil",
        attributes: { material: "Leinen", unikat: false },
        variants: [{ label: "Stück", priceCents: 1800, stock: 12 }],
      },
    ],
  },
  {
    slug: "seifenkammer",
    name: "Seifenkammer",
    industryKey: "drogerie",
    email: "seife@pilot.local",
    ownerName: "Seifenkammer",
    approved: false,
    cadence: "WEEKLY",
    individualBps: 0,
    lat: 49.169,
    lng: 10.312,
    pickupLabel: "Kammer",
    pickupAddress: "Seifengasse 3",
    openingHours: "Freitag, 14–18 Uhr\nSamstag, 10–13 Uhr",
    story: "Seife und Soda für den Haushalt, in kleinen Mengen. Der Laden wartet noch auf die Freigabe.",
    grants: [["ortskern", "REGIONAL"]],
    products: [
      {
        importKey: "kernseife",
        name: "Kernseife",
        description: "Olivenöl, zum Waschen.",
        categoryKey: "koerper",
        attributes: { inhalt: "100 g", inhaltsstoffe: "Olivenöl, Lauge", nachfuellbar: false },
        variants: [{ label: "Stück", priceCents: 350, stock: 20 }],
      },
      {
        importKey: "waschsoda",
        name: "Waschsoda",
        description: "Zum Nachfüllen in die eigene Dose.",
        categoryKey: "waschen",
        attributes: { inhalt: "500 g", inhaltsstoffe: "Natriumcarbonat", nachfuellbar: true },
        variants: [{ label: "Beutel", priceCents: 280, stock: 15 }],
      },
    ],
  },
  {
    slug: "imbiss-hofkueche",
    name: "Imbiss Hofküche",
    industryKey: "fertiggerichte",
    email: "imbiss@pilot.local",
    ownerName: "Hofküche",
    approved: true,
    cadence: "WEEKLY",
    individualBps: 0,
    lat: 49.162,
    lng: 10.352,
    pickupLabel: "Durchreiche",
    pickupAddress: "Hofstraße 5",
    openingHours: "Dienstag bis Freitag, 11–14 Uhr",
    story: "Ein Topf am Vormittag, Portionen bis zum frühen Nachmittag. Danach ist die Küche zu.",
    grants: [
      ["ortskern", "OWN_DELIVERY"],
      ["ortskern", "REGIONAL"],
      ["nahes-umland", "REGIONAL"],
      ["weiteres-umland", "REGIONAL"],
    ],
    products: [
      {
        importKey: "linseneintopf",
        name: "Linseneintopf",
        description: "Mit Sellerie, warm in der Schale.",
        categoryKey: "eintoepfe",
        attributes: { allergene: "Sellerie", warm: true },
        variants: [{ label: "Portion", priceCents: 650, stock: 20 }],
      },
      {
        importKey: "apfelkuchen",
        name: "Apfelkuchen",
        description: "Ein Stück vom Blech.",
        categoryKey: "suesses",
        attributes: { allergene: "Gluten, Ei", warm: false },
        variants: [{ label: "Stück", priceCents: 320, stock: 12 }],
      },
    ],
  },
];

async function main() {
  await prisma.platformSettings.upsert({
    where: { id: 1 },
    create: { id: 1, globalCommissionBps: 1000 },
    update: {},
  });

  const zoneSpecs = [
    { key: "ortskern", name: "Ortskern", sort: 1, prices: { OWN_DELIVERY: 250, CARRIER: 490, REGIONAL: 190 } },
    { key: "nahes-umland", name: "Nahes Umland", sort: 2, prices: { OWN_DELIVERY: 450, CARRIER: 490, REGIONAL: 290 } },
    { key: "weiteres-umland", name: "Weiteres Umland", sort: 3, prices: { OWN_DELIVERY: 700, CARRIER: 590, REGIONAL: 390 } },
  ];
  const zones = new Map<string, string>();
  for (const spec of zoneSpecs) {
    let zone = await prisma.deliveryZone.findUnique({ where: { key: spec.key } });
    if (!zone) {
      zone = await prisma.deliveryZone.create({
        data: {
          key: spec.key,
          name: spec.name,
          sort: spec.sort,
          prices: {
            create: Object.entries(spec.prices).map(([method, priceCents]) => ({
              method: method as FulfillmentMethod,
              priceCents,
            })),
          },
        },
      });
    }
    zones.set(spec.key, zone.id);
  }

  await prisma.user.upsert({
    where: { email: "admin@pilot.local" },
    update: {},
    create: { email: "admin@pilot.local", name: "Verwaltung", passwordHash: hashPassword("pilot-admin"), role: "ADMIN" },
  });
  const buyer = await prisma.user.upsert({
    where: { email: "kaeufer@pilot.local" },
    update: {},
    create: { email: "kaeufer@pilot.local", name: "Käufer", passwordHash: hashPassword("pilot-kaeufer"), role: "BUYER" },
  });

  for (const shop of shops) {
    if (await prisma.tenant.findUnique({ where: { slug: shop.slug } })) continue;
    const industry = findIndustry(shop.industryKey);
    if (!industry) throw new Error(`Branche fehlt: ${shop.industryKey}`);
    const owner = await prisma.user.upsert({
      where: { email: shop.email },
      update: {},
      create: { email: shop.email, name: shop.ownerName, passwordHash: ownerPassword, role: "OWNER" },
    });
    const tenant = await prisma.tenant.create({
      data: {
        name: shop.name,
        slug: shop.slug,
        industryKey: shop.industryKey,
        approved: shop.approved,
        openingHours: shop.openingHours,
        story: shop.story,
        pickupLabel: shop.pickupLabel,
        pickupAddress: shop.pickupAddress,
        latitude: shop.lat,
        longitude: shop.lng,
        individualCommissionBps: shop.individualBps,
        payoutCadence: shop.cadence,
        zoneMethods: {
          create: shop.grants.map(([zoneKey, method]) => {
            const zoneId = zones.get(zoneKey);
            if (!zoneId) throw new Error(`Zone fehlt: ${zoneKey}`);
            return { zoneId, method };
          }),
        },
      },
    });
    await prisma.user.update({ where: { id: owner.id }, data: { tenantId: tenant.id } });
    for (const product of shop.products) {
      const checked = industry.validate(product.attributes);
      if (!checked.ok) throw new Error(`${shop.slug}/${product.importKey}: ${checked.errors.join(" ")}`);
      await prisma.product.create({
        data: {
          tenantId: tenant.id,
          importKey: product.importKey,
          name: product.name,
          description: product.description,
          categoryKey: product.categoryKey,
          axisLabel: product.axisLabel ?? null,
          attributes: checked.value as Prisma.InputJsonValue,
          variants: {
            create: product.variants.map((variant) => ({
              label: variant.label,
              priceCents: variant.priceCents,
              stock: variant.stock,
              sku: makeSku(shop.slug, product.importKey, variant.label),
            })),
          },
        },
      });
    }
  }

  const sampleNumber = "RD-00001";
  if (!(await prisma.order.findUnique({ where: { number: sampleNumber } }))) {
    const variant = await prisma.variant.findUnique({
      where: { sku: makeSku("metzgerei-holm", "sonntagsbraten", "Standard") },
      include: { product: true },
    });
    const zoneId = zones.get("ortskern");
    if (!variant || !zoneId) throw new Error("Beispielbestellung kann nicht angelegt werden.");
    await prisma.$transaction(async (tx) => {
    await tx.variant.update({ where: { id: variant.id }, data: { stock: { decrement: 1 } } });
    await tx.tenant.update({
      where: { id: variant.product.tenantId },
      data: { stripeAccountId: `stub_acct_${variant.product.tenantId}` },
    });
    await tx.order.create({
      data: {
        number: sampleNumber,
        accessToken: "beispiel-rd-00001",
        email: buyer.email,
        userId: buyer.id,
        zoneId,
        method: "PICKUP",
        shippingCents: 0,
        goodsCents: 4000,
        totalCents: 4000,
        status: "PLACED",
        stripePaymentId: "stub_pay_RD-00001",
        parts: {
          create: {
            tenantId: variant.product.tenantId,
            goodsCents: 4000,
            globalBps: 1000,
            individualBps: 200,
            commissionCents: 480,
            payoutCents: 3520,
            payoutCadence: "MONTHLY",
            stripePayoutId: `stub_po_RD-00001_${variant.product.tenantId}_monthly`,
            lines: {
              create: {
                variantId: variant.id,
                productName: variant.product.name,
                variantLabel: variant.label,
                quantity: 1,
                unitCents: 4000,
              },
            },
          },
        },
      },
    });
    });
  }

  if (!(await prisma.counter.findUnique({ where: { id: "order" } }))) {
    const count = await prisma.order.count();
    await prisma.counter.create({ data: { id: "order", value: count } });
  }
  console.log("Seed geprüft.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
