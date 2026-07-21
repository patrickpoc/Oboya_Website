export default function AdminDashboardLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
      <span
        className="size-8 animate-spin rounded-full border-2 border-oboya-green/25 border-t-oboya-green"
        role="status"
        aria-label="Loading"
      />
      <p className="text-xs font-medium text-muted-foreground">Loading…</p>
    </div>
  );
}
