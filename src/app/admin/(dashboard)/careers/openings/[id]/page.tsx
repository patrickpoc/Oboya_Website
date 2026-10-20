"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { EditorGuard, FormSkeleton } from "@/components/admin/common";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { PendingChangeBanner } from "@/components/admin/approvals/PendingChangeBanner";
import { usePendingApprovalNotice } from "@/components/admin/approvals/use-pending-approval-notice";
import { OpeningForm } from "@/components/admin/careers/OpeningForm";
import { CareersApiError, getOpening, saveOpening } from "@/components/admin/careers/api";
import { usePermission } from "@/contexts/AdminContext";
import { buttonVariants } from "@/components/ui/button";
import { normalizeOpening, validateOpening } from "@/lib/cms/careers/validation";
import type { JobOpening } from "@/lib/cms/careers/types";
import type { CmsUser } from "@/lib/cms/types";

export default function OpeningEditorPage() {
  const t = useTranslations("admin.careers.openings");
  const tc = useTranslations("admin.careers.common");
  const router = useRouter();
  const id = useParams().id as string;
  const isNew = id === "new";
  const notifyPending = usePendingApprovalNotice();
  const canEdit = usePermission("careers", isNew ? "create" : "edit");

  const [opening, setOpening] = useState<JobOpening | null>(null);
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const loaded = isNew ? normalizeOpening({}) : await getOpening(id);
        setInitial(JSON.stringify(loaded));
        setOpening(loaded);
      } catch {
        toast.error(tc("notFound"));
        router.push("/admin/careers/openings");
        return;
      }
      // Recruiters may lack `users` access; the form then falls back to free-text names.
      fetch("/api/cms/users", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { users?: CmsUser[] } | null) =>
          setUsers((data?.users ?? []).filter((u) => u.status === "active"))
        )
        .catch(() => undefined);
    })();
  }, [id, isNew, router, tc]);

  if (!opening) return <FormSkeleton />;

  const dirty = JSON.stringify(opening) !== initial;

  const handleSave = async () => {
    const candidate = normalizeOpening({ ...opening, slug: opening.slug || opening.title.en });
    const valid = validateOpening(candidate);
    if (!valid.ok) {
      setErrors(valid.errors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      const result = await saveOpening(candidate);
      if (!notifyPending(result.payload)) toast.success(t("toasts.saved"));
      router.push("/admin/careers/openings");
    } catch (error) {
      if (error instanceof CareersApiError && (error.status === 400 || error.code === "slugTaken")) {
        setErrors([error.code]);
      } else {
        toast.error(tc("saveFailed"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Can module="careers" action={isNew ? "create" : "view"} fallback={<AccessDenied />}>
      <AdminPageHeader
        title={isNew ? t("editor.titleNew") : t("editor.titleEdit")}
        description={isNew ? undefined : opening.title.en || opening.slug}
        actions={
          <Link href="/admin/careers/openings" className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
            {tc("back")}
          </Link>
        }
      />
      {!isNew ? <PendingChangeBanner entityType="job_opening" entityId={opening.id} /> : null}
      <OpeningForm opening={opening} onChange={setOpening} users={users} errors={errors} readOnly={!canEdit} />
      {canEdit ? <EditorGuard dirty={dirty} saving={saving} onSave={() => void handleSave()} /> : null}
    </Can>
  );
}
