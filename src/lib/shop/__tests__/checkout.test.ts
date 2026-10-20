import { describe, expect, it } from "vitest";
import { quoteCoupon } from "@/lib/shop/checkout/coupons";
import { quoteFreight } from "@/lib/shop/checkout/freight";
import { CHECKOUT_PAYMENTS_ENABLED } from "@/lib/shop/checkout/payment";

describe("checkout quotes", () => {
  it("reports coupons as not configured", async () => {
    const result = await quoteCoupon({
      code: "SAVE10",
      currency: "USD",
      countryCode: "US",
      items: [],
    });
    expect(result.ok).toBe(false);
    expect(result.unavailableReason).toBe("not_configured");
    expect(result.discountAmount).toBeNull();
  });

  it("reports freight as not configured", async () => {
    const result = await quoteFreight({
      currency: "USD",
      countryCode: "US",
      postalCode: "00000",
      items: [],
    });
    expect(result.ok).toBe(false);
    expect(result.provider).toBe("none");
    expect(result.unavailableReason).toBe("not_configured");
    expect(result.amount).toBeNull();
  });

  it("keeps payments disabled", () => {
    expect(CHECKOUT_PAYMENTS_ENABLED).toBe(false);
  });
});
