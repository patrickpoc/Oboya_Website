import type { CmsUser, AuditLogEntry } from "@/lib/cms/types";
import usersData from "@/../data/cms/users.json";
import auditData from "@/../data/cms/audit-logs.json";

let usersCache: CmsUser[] = [...(usersData as CmsUser[])];
let auditCache: AuditLogEntry[] = [...(auditData as AuditLogEntry[])];

export function getCmsUsers(): CmsUser[] {
  return usersCache;
}

export function getCmsUserById(id: string): CmsUser | undefined {
  return usersCache.find((u) => u.id === id);
}

export function saveCmsUser(user: CmsUser): CmsUser {
  const idx = usersCache.findIndex((u) => u.id === user.id);
  if (idx >= 0) usersCache[idx] = user;
  else usersCache.push(user);
  return user;
}

export function deleteCmsUser(id: string): boolean {
  const idx = usersCache.findIndex((u) => u.id === id);
  if (idx < 0) return false;
  usersCache.splice(idx, 1);
  return true;
}

export function getAuditLogs(): AuditLogEntry[] {
  return auditCache;
}

export function addAuditLog(
  entry: Omit<AuditLogEntry, "id" | "createdAt">
): AuditLogEntry {
  const log: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  auditCache.unshift(log);
  return log;
}
