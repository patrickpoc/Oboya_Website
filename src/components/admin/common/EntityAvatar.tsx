import { cn } from "@/lib/utils";

export type AvatarTone = "navy" | "orange" | "green" | "sky" | "olive" | "soft";

const TONE_CLASSES: Record<AvatarTone, string> = {
  navy: "bg-oboya-blue-dark text-white",
  orange: "bg-oboya-orange text-white",
  green: "bg-oboya-green text-white",
  sky: "bg-oboya-blue-light text-white",
  olive: "bg-oboya-yellow-dark text-white",
  soft: "bg-oboya-soft-white text-oboya-blue-dark ring-1 ring-inset ring-border/70",
};

const HASH_TONES: AvatarTone[] = ["navy", "green", "sky", "orange", "olive"];

export function initialsOf(name: string) {
  return (
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** Deterministic tone from a string so the same person keeps the same color. */
export function toneFor(seed: string): AvatarTone {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return HASH_TONES[Math.abs(hash) % HASH_TONES.length];
}

export function EntityAvatar({
  name,
  tone,
  size = "md",
  dimmed,
  className,
}: {
  name: string;
  tone?: AvatarTone;
  size?: "sm" | "md" | "lg";
  dimmed?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" && "size-6 text-[10px]",
        size === "md" && "size-8 text-[11px]",
        size === "lg" && "size-11 text-sm",
        TONE_CLASSES[tone ?? toneFor(name)],
        dimmed && "opacity-40",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
