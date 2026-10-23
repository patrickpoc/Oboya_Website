export type QuotePricing = "estimated" | "mixed" | "quote_only";

/** Aggregates quote lines; `lineTotal === null` marks a line priced by the sales team. */
export function summarizeQuoteLines(lines: ReadonlyArray<{ lineTotal: number | null }>): {
  pricedTotal: number;
  pendingCount: number;
  pricing: QuotePricing;
} {
  let pricedTotal = 0;
  let pendingCount = 0;
  for (const line of lines) {
    if (line.lineTotal === null) pendingCount += 1;
    else pricedTotal += line.lineTotal;
  }
  const pricing: QuotePricing =
    pendingCount === 0 ? "estimated" : pendingCount === lines.length ? "quote_only" : "mixed";
  return { pricedTotal, pendingCount, pricing };
}
