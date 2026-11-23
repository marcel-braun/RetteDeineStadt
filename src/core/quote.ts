import { cheapestPriced, pricedOptions, type Grant, type PricedMethod, type ZonePrice } from "./fulfillment";

export type QuoteLine = {
  variantId: string;
  quantity: number;
  unitCents: number;
  label: string;
  productName: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  pickupLabel: string;
  pickupAddress: string;
  approved: boolean;
  stock: number;
};

export type Quote = {
  groups: {
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    pickupLabel: string;
    pickupAddress: string;
    lines: { variantId: string; productName: string; label: string; quantity: number; unitCents: number; lineCents: number }[];
    goodsCents: number;
  }[];
  goodsCents: number;
  options: { method: PricedMethod; available: boolean; priceCents: number | null }[];
  cheapest: { method: PricedMethod; priceCents: number } | null;
  tenantIds: string[];
};

export function assembleQuote(lines: QuoteLine[], zoneId: string | null, grants: Grant[], prices: ZonePrice[]): Quote {
  const groups = new Map<string, Quote["groups"][number]>();
  for (const line of lines) {
    const group = groups.get(line.tenantId) ?? {
      tenantId: line.tenantId,
      tenantName: line.tenantName,
      tenantSlug: line.tenantSlug,
      pickupLabel: line.pickupLabel,
      pickupAddress: line.pickupAddress,
      lines: [],
      goodsCents: 0,
    };
    const lineCents = line.unitCents * line.quantity;
    group.lines.push({
      variantId: line.variantId,
      productName: line.productName,
      label: line.label,
      quantity: line.quantity,
      unitCents: line.unitCents,
      lineCents,
    });
    group.goodsCents += lineCents;
    groups.set(line.tenantId, group);
  }
  const list = [...groups.values()].sort((a, b) => a.tenantName.localeCompare(b.tenantName, "de"));
  const tenantIds = list.map((group) => group.tenantId);
  const options = zoneId ? pricedOptions({ tenantIds, zoneId, grants, prices }) : [];
  return {
    groups: list,
    goodsCents: list.reduce((sum, group) => sum + group.goodsCents, 0),
    options,
    cheapest: cheapestPriced(options),
    tenantIds,
  };
}
