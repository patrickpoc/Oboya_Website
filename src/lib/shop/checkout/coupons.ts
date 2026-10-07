import type { CouponQuoteInput, CouponQuoteResult } from "@/lib/shop/checkout/types";

export async function quoteCoupon(
  input: CouponQuoteInput
): Promise<CouponQuoteResult> {
  return {
    ok: false,
    discountAmount: null,
    code: input.code,
    unavailableReason: "not_configured",
  };
}
