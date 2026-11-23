import type { PayoutCadence } from "@prisma/client";

export type ConnectedAccountRequest = {
  tenantId: string;
  displayName: string;
  existingAccountId: string | null;
};

export type ChargeSplit = {
  tenantId: string;
  connectedAccountId: string;
  goodsCents: number;
  commissionCents: number;
  payoutCents: number;
};

export type PlatformChargeRequest = {
  orderNumber: string;
  email: string;
  totalCents: number;
  splits: ChargeSplit[];
};

export type PayoutRequest = {
  connectedAccountId: string;
  amountCents: number;
  cadence: PayoutCadence;
  orderNumber: string;
  tenantId: string;
};

export interface ConnectPort {
  ensureConnectedAccount(request: ConnectedAccountRequest): Promise<string>;
  createPlatformCharge(request: PlatformChargeRequest): Promise<{ paymentId: string; status: "succeeded" | "failed" }>;
  schedulePayout(request: PayoutRequest): Promise<{ payoutId: string }>;
}
