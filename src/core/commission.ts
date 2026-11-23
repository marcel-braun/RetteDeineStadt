export function commissionOf(goodsCents: number, globalBps: number, individualBps: number) {
  const bps = globalBps + individualBps;
  const commissionCents = Math.round((goodsCents * bps) / 10000);
  const payoutCents = goodsCents - commissionCents;
  return { bps, commissionCents, payoutCents };
}

export type StatPart = {
  tenantId: string;
  tenantName: string;
  goodsCents: number;
  commissionCents: number;
  payoutCents: number;
};

export function summarize(parts: StatPart[]) {
  const rows = new Map<string, { tenantId: string; tenantName: string; goodsCents: number; commissionCents: number; payoutCents: number }>();
  for (const part of parts) {
    const current = rows.get(part.tenantId) ?? {
      tenantId: part.tenantId,
      tenantName: part.tenantName,
      goodsCents: 0,
      commissionCents: 0,
      payoutCents: 0,
    };
    current.goodsCents += part.goodsCents;
    current.commissionCents += part.commissionCents;
    current.payoutCents += part.payoutCents;
    rows.set(part.tenantId, current);
  }
  const list = [...rows.values()].sort((a, b) => a.tenantName.localeCompare(b.tenantName, "de"));
  const totals = list.reduce(
    (sum, row) => ({
      goodsCents: sum.goodsCents + row.goodsCents,
      commissionCents: sum.commissionCents + row.commissionCents,
      payoutCents: sum.payoutCents + row.payoutCents,
    }),
    { goodsCents: 0, commissionCents: 0, payoutCents: 0 },
  );
  return { rows: list, totals };
}
