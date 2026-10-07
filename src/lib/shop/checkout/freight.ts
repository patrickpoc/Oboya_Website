import type { FreightQuoteInput, FreightQuoteResult } from "@/lib/shop/checkout/types";

export async function quoteFreight(
  _input: FreightQuoteInput
): Promise<FreightQuoteResult> {
  return {
    ok: false,
    amount: null,
    eta: null,
    provider: "none",
    unavailableReason: "not_configured",
  };
}
