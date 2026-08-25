import type { CSSProperties } from "react";
import * as FlagIcons from "country-flag-icons/react/3x2";
import { getCountryCode } from "@/constants/country-flags";
import { cn } from "@/lib/utils";

interface CountryFlagProps {
  code: string;
  className?: string;
  title?: string;
  style?: CSSProperties;
}

export function CountryFlag({ code, className, title, style }: CountryFlagProps) {
  const normalized = getCountryCode(code);

  if (!normalized) {
    return null;
  }

  const Flag = FlagIcons[normalized as keyof typeof FlagIcons] as
    | React.ComponentType<{
        title?: string;
        className?: string;
        style?: CSSProperties;
        "aria-hidden"?: boolean | "true" | "false";
      }>
    | undefined;

  if (!Flag) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground",
          className
        )}
        style={style}
        title={title}
        aria-hidden
      >
        {normalized}
      </span>
    );
  }

  return (
    <Flag
      title={title}
      className={cn("block h-full w-full max-h-full max-w-full", className)}
      style={style}
      aria-hidden={title ? undefined : true}
    />
  );
}
