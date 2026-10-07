import "server-only";

import {
  DEFAULT_CHECKOUT_PAGE,
  normalizeCheckoutPage,
} from "@/lib/cms/checkout-page/defaults";
import type { CheckoutPageSettings } from "@/lib/cms/checkout-page/types";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";

export const CHECKOUT_PAGE_DOC_ID = "checkout-page";

export async function readCheckoutPage(options?: {
  fresh?: boolean;
}): Promise<CheckoutPageSettings> {
  const remote = await readCmsDocumentData(CHECKOUT_PAGE_DOC_ID, options);
  if (remote && typeof remote === "object") {
    return normalizeCheckoutPage(remote);
  }
  return normalizeCheckoutPage(DEFAULT_CHECKOUT_PAGE);
}

export async function saveCheckoutPage(
  payload: unknown
): Promise<CheckoutPageSettings> {
  const normalized = normalizeCheckoutPage(payload);
  await writeCmsDocumentData(CHECKOUT_PAGE_DOC_ID, "marketplace", normalized);
  return normalized;
}
