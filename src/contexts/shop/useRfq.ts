"use client";

/* Dependency lists match the provider before this split. Setters and refs are stable. */
/* eslint-disable react-hooks/exhaustive-deps */

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { ShopConfig } from "@/lib/cms/shop-config/types";
import type { RfqPayload, ShopState } from "@/lib/shop/types";
import { collectLeadContext } from "@/lib/forms/lead-context";
import type { ShopContextValue } from "@/contexts/shop/model";

export function useRfq({
  setState,
  shopConfigRef,
  state,
  getLineItems,
  estimatedTotal,
}: {
  setState: Dispatch<SetStateAction<ShopState>>;
  shopConfigRef: MutableRefObject<ShopConfig>;
  state: ShopState;
  getLineItems: ShopContextValue["getLineItems"];
  estimatedTotal: number;
}) {
  const resetRfqStatus = useCallback(() => {
    setState((prev) => ({ ...prev, rfqStatus: "idle", rfqReferenceId: null }));
  }, []);

  const submitRfq = useCallback(
    async (
      form: Omit<
        RfqPayload,
        "items" | "estimatedTotal" | "countryCode" | "currency" | "officeId"
      >,
      officeId: string | null = null
    ) => {
      if (!shopConfigRef.current.rfq.enabled) {
        throw new Error("Quote requests are disabled");
      }
      if (!state.countryCode || !state.currency) {
        throw new Error("Country and currency required");
      }

      let shouldSubmit = true;
      setState((prev) => {
        if (prev.rfqStatus === "submitting") {
          shouldSubmit = false;
          return prev;
        }
        return { ...prev, rfqStatus: "submitting" };
      });
      if (!shouldSubmit) {
        throw new Error("Submission already in progress");
      }

      const lineItems = getLineItems();
      if (lineItems.length === 0) {
        setState((prev) => ({ ...prev, rfqStatus: "error" }));
        throw new Error("Quote list is empty");
      }

      if (lineItems.some((item) => item.unavailable)) {
        setState((prev) => ({ ...prev, rfqStatus: "error" }));
        throw new Error("Unavailable items in quote list");
      }

      const payload: RfqPayload = {
        ...form,
        countryCode: state.countryCode,
        currency: state.currency,
        officeId,
        items: lineItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
          saleMode: item.saleMode,
          unitPrice: item.unitPrice,
        })),
        estimatedTotal,
      };

      try {
        const response = await fetch("/api/shop/rfq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, context: collectLeadContext() }),
        });
        const result = (await response.json()) as {
          referenceId?: string;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? "Failed to submit RFQ");
        }
        const referenceId = result.referenceId ?? `QT-${Date.now()}`;
        setState((prev) => ({
          ...prev,
          rfqStatus: "success",
          rfqReferenceId: referenceId,
          items: [],
          isQuoteModalOpen: false,
        }));
        return referenceId;
      } catch {
        setState((prev) => ({ ...prev, rfqStatus: "error" }));
        throw new Error("Failed to submit RFQ");
      }
    },
    [estimatedTotal, getLineItems, state.countryCode, state.currency]
  );
  return { resetRfqStatus, submitRfq };
}
