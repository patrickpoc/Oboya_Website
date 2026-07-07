import { cn } from "@/lib/utils";

interface SectionTitleProps {  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  titleClassName?: string;
  className?: string;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
  titleClassName,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <p className="text-sm font-medium tracking-[0.2em] text-oboya-green uppercase">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-display text-[var(--text-heading)] leading-[var(--text-heading-leading)] font-semibold tracking-tight text-oboya-blue-dark",
          titleClassName
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-[var(--text-subtitle)] leading-[var(--text-subtitle-leading)] text-muted-foreground",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
