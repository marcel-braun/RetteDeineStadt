import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { commissionOf, summarize } from "./commission";
import { distanceKm } from "./geo";
import { cheapestPriced, pricedOptions, visibleInZone } from "./fulfillment";
import { planImport } from "./import-products";
import { findIndustry, listIndustries } from "./industries/registry";
import { parseMinorUnits } from "./money";
import { assembleQuote } from "./quote";
import { shopMatchesSearch } from "./search";

test("Provision gilt nur auf den Warenwert", () => {
  const plain = commissionOf(4000, 1000, 0);
  assert.equal(plain.commissionCents, 400);
  assert.equal(plain.payoutCents, 3600);
  const raised = commissionOf(4000, 1000, 200);
  assert.equal(raised.commissionCents, 480);
  assert.equal(raised.payoutCents, 3520);
});

test("Statistik summiert Warenwert, Provision und Auszahlung je Mandant", () => {
  const summary = summarize([
    { tenantId: "a", tenantName: "Alpha", goodsCents: 4000, commissionCents: 480, payoutCents: 3520 },
    { tenantId: "a", tenantName: "Alpha", goodsCents: 1000, commissionCents: 100, payoutCents: 900 },
    { tenantId: "b", tenantName: "Beta", goodsCents: 500, commissionCents: 50, payoutCents: 450 },
  ]);
  assert.equal(summary.rows[0].goodsCents, 4000 + 1000);
  assert.equal(summary.rows[0].commissionCents, 580);
  assert.equal(summary.totals.payoutCents, 3520 + 900 + 450);
  assert.equal(summary.totals.goodsCents, 5500);
});

test("Günstigster gemeinsamer Versandweg, Abholung bleibt außen vor", () => {
  const grants = [
    { tenantId: "hof", zoneId: "ort", method: "OWN_DELIVERY" as const },
    { tenantId: "hof", zoneId: "ort", method: "REGIONAL" as const },
    { tenantId: "ofen", zoneId: "ort", method: "OWN_DELIVERY" as const },
    { tenantId: "ofen", zoneId: "ort", method: "REGIONAL" as const },
  ];
  const prices = [
    { zoneId: "ort", method: "OWN_DELIVERY" as const, priceCents: 250 },
    { zoneId: "ort", method: "CARRIER" as const, priceCents: 490 },
    { zoneId: "ort", method: "REGIONAL" as const, priceCents: 190 },
  ];
  const options = pricedOptions({ tenantIds: ["hof", "ofen"], zoneId: "ort", grants, prices });
  assert.deepEqual(cheapestPriced(options), { method: "REGIONAL", priceCents: 190 });

  const withoutRegional = grants.filter((grant) => !(grant.tenantId === "ofen" && grant.method === "REGIONAL"));
  const narrower = pricedOptions({ tenantIds: ["hof", "ofen"], zoneId: "ort", grants: withoutRegional, prices });
  assert.deepEqual(cheapestPriced(narrower), { method: "OWN_DELIVERY", priceCents: 250 });
  assert.equal(cheapestPriced(pricedOptions({ tenantIds: ["hof"], zoneId: "ort", grants: [], prices })), null);
});

test("Lieferzone blendet reine Abholläden nicht aus", () => {
  assert.equal(visibleInZone([], "ort"), true);
  assert.equal(visibleInZone([{ zoneId: "fern" }], "ort"), false);
  assert.equal(visibleInZone([{ zoneId: "ort" }], "ort"), true);
  assert.equal(visibleInZone([{ zoneId: "fern" }], null), true);
});

test("Quote bündelt Läden und nennt eine Gebühr", () => {
  const quote = assembleQuote(
    [
      line("hof", "Hofladen", 2, 250),
      line("ofen", "Bäckerei", 1, 400),
    ],
    "ort",
    [
      { tenantId: "hof", zoneId: "ort", method: "REGIONAL" },
      { tenantId: "ofen", zoneId: "ort", method: "REGIONAL" },
      { tenantId: "hof", zoneId: "ort", method: "OWN_DELIVERY" },
    ],
    [
      { zoneId: "ort", method: "REGIONAL", priceCents: 190 },
      { zoneId: "ort", method: "OWN_DELIVERY", priceCents: 250 },
    ],
  );
  assert.equal(quote.goodsCents, 900);
  assert.equal(quote.groups.length, 2);
  assert.deepEqual(quote.cheapest, { method: "REGIONAL", priceCents: 190 });
});

test("Jede Pilotbranche liefert Kategorien, Pflichtfelder und Filter", () => {
  assert.equal(listIndustries().length, 8);
  for (const industry of listIndustries()) {
    assert.ok(industry.categories.length > 0);
    assert.ok(industry.fields.some((field) => field.required));
    assert.ok(industry.filters.length > 0);
    assert.equal(findIndustry(industry.key)?.label, industry.label);
  }
  const food = findIndustry("lebensmittel");
  assert.ok(food);
  const checked = food.validate({ herkunft: "Hof", einheit: "Stück", bio: "ja", regional: "ja", allergene: "ei,milch" });
  assert.equal(checked.ok, true);
  if (checked.ok) {
    assert.equal(food.matches(checked.value, { bio: "ja", allergene: "ei" }), true);
    assert.equal(food.matches(checked.value, { allergene: "nuesse" }), false);
  }
  assert.equal(food.validate({ herkunft: "", einheit: "Stück" }).ok, false);
  const expected: Record<string, string> = {
    lebensmittel: "bio",
    baeckerei: "art",
    metzgerei: "tierart",
    getraenke: "gebinde",
    blumen: "anlass",
    handwerk: "material",
    drogerie: "anwendungsbereich",
    fertiggerichte: "ernaehrung",
  };
  for (const industry of listIndustries()) {
    assert.equal(industry.filters.some((filter) => filter.key === expected[industry.key]), true);
    assert.equal(industry.fields.some((field) => field.key === "breite" || field.key === "laenge"), false);
  }
});

test("CSV übernimmt gültige Zeilen und meldet fehlerhafte", () => {
  const industry = findIndustry("lebensmittel");
  assert.ok(industry);
  const csv = [
    "produkt_schluessel;name;beschreibung;kategorie;achse;variante;preis;bestand;herkunft;einheit;bio;regional;allergene",
    "eier;Eier;Frisch;milch-ei;Packung;6er;2,80;10;Hof;Stück;ja;ja;ei",
    "eier;Eier;Frisch;milch-ei;Packung;10er;4,20;8;Hof;Stück;ja;ja;ei",
    "honig;Honig;Mild;honig;;Glas;6,50;viel;Wiese;Glas;ja;ja;",
    "kartoffeln;Kartoffeln;Fest;gemuese;;2 kg;3,00;20;Acker;kg;nein;ja;",
  ].join("\n");
  const plan = planImport(csv, industry);
  assert.equal(plan.products.length, 2);
  assert.equal(plan.products[0].variants.length, 2);
  assert.equal(plan.errors.length, 1);
  assert.equal(plan.errors[0].line, 4);
});

test("Suche trifft Laden- und Produktnamen und lässt die Branche filtern", () => {
  const bakery = findIndustry("baeckerei");
  assert.ok(bakery);
  const shop = {
    name: "Bäckerei Krume",
    products: [
      { name: "Roggenbrot", attributes: { art: "sauerteig" } },
      { name: "Haferfladen", attributes: { art: "muerbe" } },
    ],
  };
  assert.equal(shopMatchesSearch(shop, bakery, "roggen", {}), true);
  assert.equal(shopMatchesSearch(shop, bakery, "krume", { art: "sauerteig" }), true);
  assert.equal(shopMatchesSearch(shop, bakery, "hafer", { art: "sauerteig" }), false);
  assert.equal(shopMatchesSearch(shop, null, "unbekannt", {}), false);
});

test("OpenAPI beschreibt die HTTP-API", () => {
  const spec = readFileSync(path.join(process.cwd(), "docs/openapi.yaml"), "utf8");
  for (const route of ["/api/v1/entdecken", "/api/v1/auth/kunde", "/api/v1/auth/laden", "/api/v1/warenkorb", "/api/v1/bestellungen", "/api/v1/verwaltung", "/api/v1/inhaber"]) {
    assert.ok(spec.includes(route), route);
  }
});

test("Kern importiert keine Oberfläche", () => {
  const root = path.join(process.cwd(), "src/core");
  const files = walk(root).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
  const forbidden = /from\s+["'](?:next|react|@\/app|@\/components|@\/ui|@\/api)/;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.equal(forbidden.test(source), false, file);
  }
});

test("Beträge und Entfernung", () => {
  assert.equal(parseMinorUnits("4,80"), 480);
  assert.equal(parseMinorUnits("10"), 1000);
  assert.equal(parseMinorUnits("10,5"), 1050);
  assert.equal(parseMinorUnits(""), null);
  assert.equal(parseMinorUnits("-1"), null);
  const km = distanceKm({ lat: 49.168, lng: 10.33 }, { lat: 49.178, lng: 10.318 });
  assert.ok(km > 1.2 && km < 1.6);
});

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function line(tenantId: string, tenantName: string, quantity: number, unitCents: number) {
  return {
    variantId: `${tenantId}-v`,
    quantity,
    unitCents,
    label: "Standard",
    productName: "Ware",
    tenantId,
    tenantName,
    tenantSlug: tenantId,
    pickupLabel: "Tür",
    pickupAddress: "Weg 1",
    approved: true,
    stock: 10,
  };
}
