"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { EditorGuard, FormSkeleton, StatusPill } from "@/components/admin/common";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { ApplicationForm } from "@/components/admin/careers/ApplicationForm";
import { ApplicationPipeline } from "@/components/admin/careers/ApplicationPipeline";
import { ApplicationTimeline } from "@/components/admin/careers/ApplicationTimeline";
import { PIPELINE_TONES } from "@/components/admin/careers/ApplicationsTable";
import { CvUploadField } from "@/components/admin/careers/CvUploadField";
import {
  CareersApiError,
  anonymizeApplication,
  deleteApplication,
  getApplication,
  listActivities,
  listApplications,
  listOpenings,
  markApplicationRead,
  updateApplication,
} from "@/components/admin/careers/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeApplication, validateApplication } from "@/lib/cms/careers/validation";
import type { JobApplication, JobApplicationActivity, JobOpening } from "@/lib/cms/careers/types";
import type { CmsUser } from "@/lib/cms/types";

const LIST = "/admin/careers/applications";

export default function ApplicationDetailPage() {
  const t = useTranslations("admin.careers.applications");
  const tPipe = useTranslations("admin.careers.common.pipeline");
  const tc = useTranslations("admin.careers.common");
  const router = useRouter();
  const id = useParams().id as string;

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [initial, setInitial] = useState("");
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [activities, setActivities] = useState<JobApplicationActivity[]>([]);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = (loaded: JobApplication) => {
    setApplication(loaded);
    setInitial(JSON.stringify(loaded));
  };

  useEffect(() => {
    void (async () => {
      try {
        const [loaded, acts] = await Promise.all([getApplication(id), listActivities(id)]);
        load(loaded);
        setActivities(acts);
        if (!loaded.readAt && !loaded.anonymizedAt) {
          markApplicationRead(id)
            .then(({ readAt }) => {
              setApplication((cur) => cur && { ...cur, readAt });
              setInitial((cur) => JSON.stringify({ ...(JSON.parse(cur) as JobApplication), readAt }));
            })
            .catch(() => undefined);
        }
      } catch {
        toast.error(tc("notFound"));
        router.push(LIST);
        return;
      }
      listOpenings({ status: "all" })
        .then(setOpenings)
        .catch(() => undefined);
      // Recruiters may lack `users` access; the pipeline then falls back to a free-text assignee.
      fetch("/api/cms/users", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { users?: CmsUser[] } | null) =>
          setUsers((data?.users ?? []).filter((u) => u.status === "active"))
        )
        .catch(() => undefined);
    })();
  }, [id, router, tc]);

  const email = application?.email.trim().toLowerCase() ?? "";
  const openingId = application?.openingId ?? null;
  useEffect(() => {
    if (!email.includes("@")) return;
    const timer = setTimeout(() => {
      listApplications({ q: email, openingId: openingId ?? "talent_pool" })
        .then((rows) => setDuplicateEmail(rows.some((r) => r.id !== id && r.email.toLowerCase() === email)))
        .catch(() => undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [email, openingId, id]);

  if (!application) return <FormSkeleton />;

  const dirty = JSON.stringify(application) !== initial;
  const anonymized = Boolean(application.anonymizedAt);

  const handleSave = async () => {
    const candidate = normalizeApplication({
      ...application,
      consentPrivacyAt: application.consentPrivacyAt ?? new Date().toISOString(),
    });
    const valid = validateApplication(candidate);
    if (!valid.ok) {
      setErrors(valid.errors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      load(await updateApplication(id, candidate));
      setActivities(await listActivities(id));
      toast.success(t("toasts.updated"));
    } catch (error) {
      if (error instanceof CareersApiError && error.status === 400) setErrors([error.code]);
      else toast.error(tc("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCv = (next: JobApplication) => {
    const cv = pickCv(next);
    setApplication((cur) => cur && { ...cur, ...cv });
    setInitial((cur) => JSON.stringify({ ...(JSON.parse(cur) as JobApplication), ...cv }));
  };

  const handleDanger = async (kind: "anonymize" | "delete") => {
    if (!window.confirm(t(`confirm.${kind}`, { name: application.fullName }))) return;
    try {
      if (kind === "delete") {
        await deleteApplication(id);
        toast.success(t("toasts.deleted"));
        router.push(LIST);
      } else {
        load(await anonymizeApplication(id));
        setActivities(await listActivities(id));
        toast.success(t("toasts.anonymized"));
      }
    } catch {
      toast.error(tc("saveFailed"));
    }
  };

  return (
    <Can module="careers" action="edit" fallback={<AccessDenied />}>
      <AdminPageHeader
        title={application.fullName || t("detail.titleEdit")}
        description={openings.find((opening) => opening.id === application.openingId)?.title.en || t("filters.talentPool")}
        actions={
          <>
          <StatusPill tone={PIPELINE_TONES[application.status]}>{tPipe(application.status)}</StatusPill>
          <Link href={LIST} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
            {tc("back")}
          </Link>
          </>
        }
      />
      {anonymized ? (
        <p className="mb-4 rounded-lg border border-border bg-muted p-3 text-sm">{t("detail.anonymizedNotice")}</p>
      ) : (
        <div className="space-y-6">
          <ApplicationForm
            application={application}
            onChange={setApplication}
            openings={openings}
            errors={errors}
            duplicateEmail={duplicateEmail}
            sidebar={
              <>
                <ApplicationPipeline application={application} onChange={setApplication} users={users} />
                <CvUploadField application={application} onChange={handleCv} />
              </>
            }
          />

        </div>
      )}
        <div className="mt-6 space-y-6">
          <ApplicationTimeline
            applicationId={id}
            activities={activities}
            anonymized={anonymized}
            onAdded={(a) => setActivities((cur) => [a, ...cur])}
          />
          <Can module="careers" action="delete">
            <Card className="border-oboya-orange/40">
              <CardHeader>
                <CardTitle className="text-oboya-orange">{t("detail.sections.dangerZone")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {!anonymized ? (
                  <Button type="button" variant="outline" onClick={() => void handleDanger("anonymize")}>
                    {t("detail.actions.anonymize")}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  className="bg-oboya-orange text-white hover:bg-oboya-orange/90"
                  onClick={() => void handleDanger("delete")}
                >
                  {t("detail.actions.delete")}
                </Button>
              </CardContent>
            </Card>
          </Can>
        </div>
      {anonymized ? null : <EditorGuard dirty={dirty} saving={saving} onSave={() => void handleSave()} />}
    </Can>
  );
}

/** CV changes are persisted immediately by their own endpoints, so only merge cv_* fields into the form state. */
function pickCv(a: JobApplication) {
  return { cvPath: a.cvPath, cvFilename: a.cvFilename, cvMime: a.cvMime, cvSize: a.cvSize };
}
