import { cn } from "@/lib/utils";

export function AdminPageFooterActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-64 right-0 z-10 flex items-center justify-end gap-2 border-t border-border/60 bg-white/95 px-6 py-4 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/80",
        className
      )}
    >
      {children}
    </div>
  );
}
