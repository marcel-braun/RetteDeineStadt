import type { ConnectPort } from "./port";
import { StubConnect } from "./stub";

export function createConnect(): ConnectPort {
  if (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET) {
    throw new Error("Stripe-Schlüssel sind in diesem Stand nicht vorgesehen. Die Schnittstelle ist vorbereitet, aber nicht angebunden.");
  }
  return new StubConnect();
}
