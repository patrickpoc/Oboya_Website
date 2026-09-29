import { cn } from "@/lib/utils";

export type PillTone =
  | "success"
  | "info"
  | "brand"
  | "warning"
  | "danger"
  | "neutral"
  | "muted"
  | "highlight";

export const PILL_TONE_CLASSES: Record<PillTone, string> = {
  success: "bg-oboya-green text-white",
  info: "bg-oboya-blue-light text-white",
  brand: "bg-oboya-blue text-white",
  warning: "bg-oboya-yellow-light text-oboya-blue-dark",
  danger: "bg-oboya-orange text-white",
  neutral: "bg-oboya-soft-white text-oboya-blue-dark/80 ring-1 ring-inset ring-border/70",
  muted: "bg-muted text-muted-foreground",
  highlight: "bg-oboya-yellow-dark text-white",
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
  title,
  size = "sm",
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
  title?: string;
  size?: "xs" | "sm";
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold",
        size === "xs" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-[11px]",
        PILL_TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
