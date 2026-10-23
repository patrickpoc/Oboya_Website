"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "./Field";
import { PIPELINE_STATUSES, type JobApplication } from "@/lib/cms/careers/types";
import { normalizeApplication } from "@/lib/cms/careers/validation";
import type { CmsUser } from "@/lib/cms/types";

const SELECT = "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm";

export function ApplicationPipeline({
  application,
  onChange,
  users,
}: {
  application: JobApplication;
  onChange: (next: JobApplication) => void;
  users: CmsUser[];
}) {
  const t = useTranslations("admin.careers.applications.detail");
  const tPipe = useTranslations("admin.careers.common.pipeline");
  const set = (patch: Partial<JobApplication>) => onChange({ ...application, ...patch });
  const ratingId = useId();
  const [tagDraft, setTagDraft] = useState(application.tags.join(", "));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sections.pipeline")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
          <Field label={t("fields.status")}>
            <select
              className={SELECT}
              value={application.status}
              onChange={(e) => set({ status: e.target.value as JobApplication["status"] })}
            >
              {PIPELINE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {tPipe(s)}
                </option>
              ))}
            </select>
          </Field>
        <div className="space-y-1.5">
          <span id={ratingId} className="text-sm font-medium">
            {t("fields.rating")}
          </span>
          <div role="group" aria-labelledby={ratingId} className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-oboya-yellow-light/20 focus-visible:outline-2 focus-visible:outline-oboya-blue"
                aria-label={t("ratingStar", { value: n })}
                aria-pressed={application.rating === n}
                onClick={() => set({ rating: application.rating === n ? undefined : n })}
              >
                <Star
                  className={`size-5 ${(application.rating ?? 0) >= n ? "fill-oboya-yellow-dark text-oboya-yellow-dark" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <Field label={t("fields.assignee")}>
          {users.length === 0 ? (
            <Input
              value={application.assigneeName ?? ""}
              onChange={(e) => set({ assigneeId: undefined, assigneeName: e.target.value || undefined })}
            />
          ) : (
            <select
              className={SELECT}
              value={application.assigneeId ?? ""}
              onChange={(e) => {
                const user = users.find((u) => u.id === e.target.value);
                set({ assigneeId: user?.id, assigneeName: user?.name });
              }}
            >
              <option value="">—</option>
              {application.assigneeId && !users.some((user) => user.id === application.assigneeId) ? (
                <option value={application.assigneeId}>{application.assigneeName || application.assigneeId}</option>
              ) : null}
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label={t("fields.tags")}>
          <Input
            value={tagDraft}
            onChange={(e) => {
              setTagDraft(e.target.value);
              set({ tags: normalizeApplication({ tags: e.target.value.split(",") }).tags });
            }}
          />
        </Field>
        {application.status === "rejected" ? (
          <Field label={t("fields.rejectionReason")} >
            <textarea
              rows={2}
              value={application.rejectionReason ?? ""}
              onChange={(e) => set({ rejectionReason: e.target.value || undefined })}
              className="w-full rounded-lg border border-input px-3 py-2 text-sm"
            />
          </Field>
        ) : null}
      </CardContent>
    </Card>
  );
}
