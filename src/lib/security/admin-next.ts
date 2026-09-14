const DEFAULT_NEXT = "/admin/dashboard";

export function safeAdminNext(next: string | null | undefined): string {
  if (!next) return DEFAULT_NEXT;
  const value = next.trim();
  if (!value.startsWith("/")) return DEFAULT_NEXT;
  if (value.startsWith("//") || value.startsWith("/\\")) return DEFAULT_NEXT;
  if (value.includes("://") || value.includes("@") || value.includes("\\")) {
    return DEFAULT_NEXT;
  }
  if (/%2f|%5c|%40/i.test(value)) return DEFAULT_NEXT;
  if (!value.startsWith("/admin")) return DEFAULT_NEXT;
  if (value === "/admin/change-password") return DEFAULT_NEXT;
  return value;
}
