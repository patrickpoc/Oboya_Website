"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Inbox, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("rounded-xl border border-dashed border-border/70 bg-white p-8 md:p-10", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-oboya-soft-white text-oboya-blue">
          <Icon />
        </EmptyMedia>
        <EmptyTitle className="text-base text-oboya-blue-dark">{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action}
    </Empty>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  const t = useTranslations("admin.common");
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-oboya-orange/30 bg-oboya-orange/5 p-8 text-center",
        className
      )}
    >
      <AlertTriangle className="size-6 text-oboya-orange" />
      <p className="text-sm text-oboya-blue-dark">{message ?? t("failedToLoad")}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-white" aria-busy="true">
      <div className="flex gap-4 border-b border-border/60 bg-oboya-soft-white/60 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-border/40 px-4 py-3.5 last:border-b-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn("h-3 flex-1", c === 0 && "max-w-40")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-white p-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ sections = 2, fields = 3 }: { sections?: number; fields?: number }) {
  return (
    <div className="space-y-6" aria-busy="true">
      {Array.from({ length: sections }).map((_, s) => (
        <div key={s} className="space-y-4 rounded-xl border border-border/60 bg-white p-5">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: fields }).map((_, f) => (
            <div key={f} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ComingSoon({
  module,
  description,
}: {
  module: React.ReactNode;
  description?: React.ReactNode;
}) {
  const t = useTranslations("admin.common");
  return (
    <EmptyState
      icon={Sparkles}
      title={t("comingSoonTitle")}
      description={description ?? t("comingSoonDescription", { module: String(module) })}
    />
  );
}
