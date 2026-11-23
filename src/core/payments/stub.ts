import type { ConnectPort } from "./port";

export class StubConnect implements ConnectPort {
  async ensureConnectedAccount(request: { tenantId: string; existingAccountId: string | null }) {
    return request.existingAccountId ?? `stub_acct_${request.tenantId}`;
  }

  async createPlatformCharge(request: { orderNumber: string; totalCents: number }) {
    if (request.totalCents < 0) return { paymentId: "", status: "failed" as const };
    return { paymentId: `stub_pay_${request.orderNumber}`, status: "succeeded" as const };
  }

  async schedulePayout(request: { orderNumber: string; tenantId: string; cadence: string }) {
    return { payoutId: `stub_po_${request.orderNumber}_${request.tenantId}_${request.cadence.toLowerCase()}` };
  }
}
