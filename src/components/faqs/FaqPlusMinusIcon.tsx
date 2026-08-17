import { cn } from "@/lib/utils";

interface FaqPlusMinusIconProps {
  className?: string;
}

/**
 * Plus → minus “drop” synced with accordion expand via group-aria-expanded.
 */
export function FaqPlusMinusIcon({ className }: FaqPlusMinusIconProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center text-oboya-green sm:size-11",
        className
      )}
    >
      <span className="absolute h-[2.5px] w-6 rounded-full bg-current sm:w-7" />
      <span
        className={cn(
          "absolute h-6 w-[2.5px] rounded-full bg-current sm:h-7",
          "origin-center will-change-transform",
          "transition-transform duration-300 ease-[cubic-bezier(0.45,0.05,0.25,1)]",
          "group-aria-expanded/accordion-trigger:scale-y-0"
        )}
      />
    </span>
  );
}
