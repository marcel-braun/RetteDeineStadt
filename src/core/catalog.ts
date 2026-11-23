import { distanceKm } from "./geo";
import { prisma } from "./db";
import { METHOD_LABEL, visibleInZone, type PricedMethod } from "./fulfillment";
import { findIndustry, listIndustries } from "./industries/registry";
import { presentAttribute, readAttributes, type IndustryField } from "./industries/types";
import { DEFAULT_RADIUS_KM, MAP_BOUNDS, PILOT_CENTER } from "./region";
import { shopMatchesSearch } from "./search";

export type DiscoveryInput = {
  q?: string;
  km?: number;
  lat?: number;
  lng?: number;
  zoneKey?: string;
  industryKey?: string;
  filters?: Record<string, string>;
};

function clampRadius(value: number | undefined) {
  if (!Number.isFinite(value)) return DEFAULT_RADIUS_KM;
  return Math.min(30, Math.max(1, value as number));
}

export function filterView(field: IndustryField) {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    options: field.options ?? [],
  };
}

export async function discover(input: DiscoveryInput) {
  const km = clampRadius(input.km);
  const lat = Number.isFinite(input.lat) ? (input.lat as number) : PILOT_CENTER.lat;
  const lng = Number.isFinite(input.lng) ? (input.lng as number) : PILOT_CENTER.lng;
  const q = (input.q ?? "").trim();
  const industry = input.industryKey ? findIndustry(input.industryKey) : null;
  const selection: Record<string, string> = {};
  if (industry) {
    for (const filter of industry.filters) {
      const value = input.filters?.[filter.key];
      if (value) selection[filter.key] = value;
    }
  }

  const [shops, zones] = await Promise.all([
    prisma.tenant.findMany({
      where: { approved: true },
      include: { zoneMethods: true, products: { select: { name: true, attributes: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.deliveryZone.findMany({ orderBy: { sort: "asc" } }),
  ]);
  const zone = zones.find((item) => item.key === (input.zoneKey ?? "")) ?? null;
  const visible = shops
    .map((shop) => ({ shop, distanceKm: distanceKm({ lat, lng }, { lat: shop.latitude, lng: shop.longitude }) }))
    .filter(({ shop, distanceKm: distance }) => {
      if (distance > km) return false;
      if (!visibleInZone(shop.zoneMethods, zone?.id ?? null)) return false;
      if (industry && shop.industryKey !== industry.key) return false;
      const branch = findIndustry(shop.industryKey);
      return shopMatchesSearch(shop, industry && shop.industryKey === industry.key ? branch : null, q, selection);
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const presentKeys = new Set(shops.map((shop) => shop.industryKey));

  return {
    q,
    km,
    center: { lat, lng },
    bounds: MAP_BOUNDS,
    zoneKey: zone?.key ?? "",
    industryKey: industry?.key ?? "",
    zones: zones.map((item) => ({ key: item.key, name: item.name })),
    industries: listIndustries()
      .filter((item) => presentKeys.has(item.key))
      .map((item) => ({
        key: item.key,
        label: item.label,
        filters: item.filters.map((filter) => {
          const field = item.fields.find((entry) => entry.key === filter.key);
          return field ? { ...filterView(field), label: filter.label } : { key: filter.key, label: filter.label, type: "select" as const, options: [] };
        }),
      })),
    selection,
    shops: visible.map(({ shop, distanceKm: distance }) => ({
      slug: shop.slug,
      name: shop.name,
      industry: findIndustry(shop.industryKey)?.label ?? shop.industryKey,
      distanceKm: distance,
      lat: shop.latitude,
      lng: shop.longitude,
      methods: [...new Set(shop.zoneMethods.map((grant) => METHOD_LABEL[grant.method as PricedMethod]))],
    })),
  };
}

export async function loadShop(slug: string, viewer: { role: string; tenantId: string | null } | null) {
  const shop = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      products: { include: { variants: { orderBy: { label: "asc" } } }, orderBy: { name: "asc" } },
      zoneMethods: true,
    },
  });
  if (!shop) return null;
  const canPreview = viewer?.role === "ADMIN" || viewer?.tenantId === shop.id;
  if (!shop.approved && !canPreview) return null;
  const industry = findIndustry(shop.industryKey);
  return {
    slug: shop.slug,
    name: shop.name,
    approved: shop.approved,
    industry: industry?.label ?? shop.industryKey,
    story: shop.story,
    openingHours: shop.openingHours,
    pickupLabel: shop.pickupLabel,
    pickupAddress: shop.pickupAddress,
    methods: [...new Set(shop.zoneMethods.map((grant) => METHOD_LABEL[grant.method as PricedMethod]))],
    products: shop.products.map((product) => {
      const attributes = readAttributes(product.attributes);
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: industry?.categoryLabel(product.categoryKey) ?? product.categoryKey,
        axisLabel: product.axisLabel,
        facts: industry
          ? industry.fields.flatMap((field) => {
              const text = presentAttribute(field, attributes[field.key]);
              return text === null ? [] : [{ label: field.label, text }];
            })
          : [],
        variants: product.variants.map((variant) => ({
          id: variant.id,
          label: variant.label,
          priceCents: variant.priceCents,
          stock: variant.stock,
        })),
      };
    }),
  };
}
