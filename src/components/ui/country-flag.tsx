import * as FlagIcons from "country-flag-icons/react/3x2";
import { getCountryCode } from "@/constants/country-flags";
import { cn } from "@/lib/utils";

interface CountryFlagProps {
  code: string;
  className?: string;
  title?: string;
}

export function CountryFlag({ code, className, title }: CountryFlagProps) {
  const normalized = getCountryCode(code);

  if (!normalized) {
    return null;
  }

  const Flag = FlagIcons[normalized as keyof typeof FlagIcons] as
    | React.ComponentType<{ title?: string; className?: string }>
    | undefined;

  if (!Flag) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground",
          className
        )}
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
      className={cn("block size-full", className)}
      aria-hidden={title ? undefined : true}
    />
  );
}
