import { cn } from "@/lib/utils";

/**
 * Two-pane layout that never overflows its container: the detail column can
 * shrink (minmax(0,1fr)) and wide content scrolls inside its own card.
 */
export function MasterDetailLayout({
  list,
  detail,
  listWidth = "260px",
  className,
}: {
  list: React.ReactNode;
  detail: React.ReactNode;
  listWidth?: "240px" | "260px" | "300px" | "340px";
  className?: string;
}) {
  const cols = {
    "240px": "lg:grid-cols-[240px_minmax(0,1fr)]",
    "260px": "lg:grid-cols-[260px_minmax(0,1fr)]",
    "300px": "lg:grid-cols-[300px_minmax(0,1fr)]",
    "340px": "lg:grid-cols-[340px_minmax(0,1fr)]",
  }[listWidth];
  return (
    <div className={cn("grid gap-6", cols, className)}>
      <aside className="min-w-0 self-start rounded-xl border border-border/60 bg-white lg:sticky lg:top-20">
        {list}
      </aside>
      <section className="min-w-0 rounded-xl border border-border/60 bg-white">{detail}</section>
    </div>
  );
}
