import type { FormPriority, FormSubmissionStatus } from "@/lib/cms/types";
import { StatusPill, type PillTone } from "@/components/admin/common/StatusPill";

export const STATUS_TONE: Record<FormSubmissionStatus, PillTone> = {
  new: "brand",
  in_progress: "info",
  replied: "success",
  converted: "success",
  archived: "muted",
  spam: "danger",
};

export const PRIORITY_TONE: Record<FormPriority, PillTone> = {
  low: "neutral",
  normal: "muted",
  high: "warning",
  urgent: "danger",
};

export function LeadStatusPill({
  status,
  label,
}: {
  status: FormSubmissionStatus;
  label: string;
}) {
  return <StatusPill tone={STATUS_TONE[status]}>{label}</StatusPill>;
}

export function LeadPriorityPill({
  priority,
  label,
}: {
  priority: FormPriority;
  label: string;
}) {
  if (priority === "normal") return null;
  return <StatusPill tone={PRIORITY_TONE[priority]} size="xs">{label}</StatusPill>;
}
