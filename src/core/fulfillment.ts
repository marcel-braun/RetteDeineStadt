export const PRICED_METHODS = ["OWN_DELIVERY", "CARRIER", "REGIONAL"] as const;

export type PricedMethod = (typeof PRICED_METHODS)[number];
export type AnyMethod = PricedMethod | "PICKUP";

export const METHOD_LABEL: Record<AnyMethod, string> = {
  PICKUP: "Abholung",
  OWN_DELIVERY: "Eigene Lieferung",
  CARRIER: "Dienstleister",
  REGIONAL: "Regionaler Lieferservice",
};

export type Grant = { tenantId: string; zoneId: string; method: PricedMethod };
export type ZonePrice = { zoneId: string; method: PricedMethod; priceCents: number };

export function isPricedMethod(value: string): value is PricedMethod {
  return (PRICED_METHODS as readonly string[]).includes(value);
}

export function pricedOptions(input: { tenantIds: string[]; zoneId: string; grants: Grant[]; prices: ZonePrice[] }) {
  return PRICED_METHODS.map((method) => {
    const granted =
      input.tenantIds.length > 0 &&
      input.tenantIds.every((tenantId) =>
        input.grants.some((grant) => grant.tenantId === tenantId && grant.zoneId === input.zoneId && grant.method === method),
      );
    const price = input.prices.find((item) => item.zoneId === input.zoneId && item.method === method) ?? null;
    return {
      method,
      available: granted && price !== null,
      priceCents: granted && price ? price.priceCents : null,
    };
  });
}

export function cheapestPriced(options: { method: PricedMethod; available: boolean; priceCents: number | null }[]) {
  const ready = options.flatMap((option) =>
    option.available && option.priceCents !== null ? [{ method: option.method, priceCents: option.priceCents }] : [],
  );
  ready.sort(
    (a, b) => a.priceCents - b.priceCents || PRICED_METHODS.indexOf(a.method) - PRICED_METHODS.indexOf(b.method),
  );
  return ready[0] ?? null;
}

export function visibleInZone(grants: { zoneId: string }[], zoneId: string | null) {
  if (!zoneId) return true;
  if (grants.length === 0) return true;
  return grants.some((grant) => grant.zoneId === zoneId);
}
