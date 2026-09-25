"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  formatPriceInput,
  parsePriceInput,
  PRICE_INPUT_INCOMPLETE,
  type PriceCurrencyHint,
} from "@/lib/cms/parse-price";
import { cn } from "@/lib/utils";

type Props = {
  value: number | null | undefined;
  currency: PriceCurrencyHint;
  onChange: (next: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function BulkPriceInput({
  value,
  currency,
  onChange,
  placeholder,
  className,
  disabled,
}: Props) {
  const [draft, setDraft] = useState(() => formatPriceInput(value, currency));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    setDraft(formatPriceInput(value, currency));
  }, [value, currency, focused]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      placeholder={placeholder}
      className={cn("h-9 min-w-[9.5rem] w-full text-sm tabular-nums", className)}
      value={draft}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const trimmed = draft.trim();
        if (!trimmed) {
          onChange(null);
          setDraft("");
          return;
        }
        const parsed = parsePriceInput(trimmed, currency);
        if (parsed === PRICE_INPUT_INCOMPLETE || parsed === null) {
          setDraft(formatPriceInput(value, currency));
          return;
        }
        onChange(parsed);
        setDraft(formatPriceInput(parsed, currency));
      }}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        if (!next.trim()) {
          onChange(null);
          return;
        }
        const parsed = parsePriceInput(next, currency, { allowIncomplete: true });
        if (parsed === PRICE_INPUT_INCOMPLETE) return;
        if (parsed === null) return;
        onChange(parsed);
      }}
    />
  );
}
