import type { CurrencyCode } from "@/lib/shop/types";

export type CheckoutLineRef = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export type FreightQuoteInput = {
  countryCode: string;
  postalCode: string;
  currency: CurrencyCode;
  items: CheckoutLineRef[];
};

export type FreightQuoteResult = {
  ok: boolean;
  amount: number | null;
  eta: string | null;
  provider: string;
  unavailableReason: string | null;
};

export type CouponQuoteInput = {
  code: string;
  countryCode: string;
  currency: CurrencyCode;
  items: CheckoutLineRef[];
};

export type CouponQuoteResult = {
  ok: boolean;
  discountAmount: number | null;
  code: string;
  unavailableReason: string | null;
};

/**
 * Optional commercial fields for a future RFQ payload.
 * v1 does not send them. When a provider exists, the server must re-check
 * the amount the same way it re-prices line items.
 */
export type RfqCommercialExtensions = {
  freight: FreightQuoteResult | null;
  coupon: CouponQuoteResult | null;
};
