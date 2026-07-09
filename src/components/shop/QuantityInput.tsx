"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { clampQuantity } from "@/lib/shop/quantity";
import { cn } from "@/lib/utils";

const spinnerHidden =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  moq?: number;
  size?: "sm" | "md";
  showQuickIncrements?: boolean;
  id?: string;
  className?: string;
}

export function QuantityInput({
  value,
  onChange,
  moq = 1,
  size = "md",
  showQuickIncrements = false,
  id,
  className,
}: QuantityInputProps) {
  const t = useTranslations("shop");
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitDraft = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    const next = clampQuantity(Number.isNaN(parsed) ? moq : parsed, moq);
    onChange(next);
    setDraft(String(next));
  };

  const adjust = (delta: number) => {
    onChange(clampQuantity(value + delta, moq));
  };

  const buttonSize = size === "sm" ? "size-6 text-xs" : "size-8 text-sm";
  const inputSize = size === "sm" ? "h-7 w-14 text-xs" : "h-8 w-16 text-sm";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={value <= moq}
          className={cn(
            buttonSize,
            "shrink-0 rounded-md border border-border leading-none hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          )}
          aria-label={t("decreaseQuantity")}
        >
          −
        </button>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={moq}
          max={999999}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commitDraft(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft(draft);
            }
          }}
          className={cn(spinnerHidden, inputSize, "px-1 text-center")}
        />
        <button
          type="button"
          onClick={() => adjust(1)}
          className={cn(
            buttonSize,
            "shrink-0 rounded-md border border-border leading-none hover:bg-muted"
          )}
          aria-label={t("increaseQuantity")}
        >
          +
        </button>
      </div>

      {showQuickIncrements && (
        <div className="flex flex-wrap gap-1.5">
          {[100, 1000, 10000].map((increment) => (
            <button
              key={increment}
              type="button"
              onClick={() => adjust(increment)}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-oboya-blue-dark hover:bg-muted"
            >
              +{increment.toLocaleString()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
