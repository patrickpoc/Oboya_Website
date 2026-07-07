"use client";

import { Loader2 } from "lucide-react";

export function CatalogueLoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <Loader2
        className="size-10 animate-spin text-oboya-green"
        aria-hidden
      />
      {label && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
