"use client";

import { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Can } from "@/components/admin/permissions/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_STATUSES, type JobApplicationActivity, type PipelineStatus } from "@/lib/cms/careers/types";

const isPipelineStatus = (v: unknown): v is PipelineStatus => PIPELINE_STATUSES.includes(v as PipelineStatus);
import { addNote } from "./api";

export function ApplicationTimeline({
  applicationId,
  activities,
  onAdded,
  anonymized = false,
}: {
  anonymized?: boolean;
  applicationId: string;
  activities: JobApplicationActivity[];
  onAdded: (activity: JobApplicationActivity) => void;
}) {
  const noteId = useId();
  const format = useFormatter();
  const t = useTranslations("admin.careers.applications.detail");
  const tc = useTranslations("admin.careers.common");
  const tPipe = useTranslations("admin.careers.common.pipeline");
  const status = (v: unknown) => (isPipelineStatus(v) ? tPipe(v) : String(v ?? ""));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      onAdded(await addNote(applicationId, draft));
      setDraft("");
    } catch {
      toast.error(tc("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sections.notes")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {anonymized ? null : (
        <Can module="careers" action="edit">
          <label htmlFor={noteId} className="block text-sm font-medium">{t("notes.placeholder")}</label>
          <textarea
            id={noteId}
            disabled={busy}
            rows={3}
            value={draft}
            maxLength={4000}
            placeholder={t("notes.placeholder")}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm"
          />
          <Button type="button" size="sm" disabled={busy || !draft.trim()} onClick={() => void submit()}>
            {t("notes.add")}
          </Button>
        </Can>
        )}
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("notes.empty")}</p>
        ) : (
          <ol className="space-y-3 border-l border-border pl-4">
            {activities.map((a) => (
              <li key={a.id} className="relative rounded-lg bg-oboya-soft-white/60 p-3 text-sm">
                <p className="font-medium text-oboya-blue-dark">{t(`timeline.${a.kind}`)}</p>
                {a.kind === "status_change" && a.meta ? (
                  <p className="text-xs text-muted-foreground">
                    {status(a.meta.from)} → {status(a.meta.to)}
                  </p>
                ) : null}
                {a.kind === "rating" && a.meta ? (
                  <p className="text-xs text-muted-foreground">
                    {String(a.meta.from ?? "—")} → {String(a.meta.to ?? "—")}
                  </p>
                ) : null}
                {a.body ? <p className="whitespace-pre-wrap">{a.body}</p> : null}
                <p className="text-xs text-muted-foreground">
                  {a.actorName ? <>{a.actorName} · </> : null}
                  <time dateTime={a.createdAt}>{format.dateTime(new Date(a.createdAt), { dateStyle: "medium", timeStyle: "short" })}</time>
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
