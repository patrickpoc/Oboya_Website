"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { LeadDetail, type StaffOption } from "@/components/admin/leads/LeadDetail";
import { ErrorState, FormSkeleton } from "@/components/admin/common";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { useAdmin } from "@/contexts/AdminContext";
import type { FormActivity, FormSubmission } from "@/lib/cms/types";
import { leadName } from "@/lib/cms/forms/crm";
import { Button } from "@/components/ui/button";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("admin.leads");
  const tCommon = useTranslations("admin.common");
  const { can } = useAdmin();
  const [item, setItem] = useState<FormSubmission | null>(null);
  const [related, setRelated] = useState<FormSubmission[]>([]);
  const [activities, setActivities] = useState<FormActivity[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const [detailRes, actRes, staffRes] = await Promise.all([
          fetch(`/api/cms/forms?id=${params.id}`, { cache: "no-store", signal: controller.signal }),
          fetch(`/api/cms/forms/${params.id}/activities`, { cache: "no-store", signal: controller.signal }),
          fetch("/api/cms/forms/assignees", { cache: "no-store", signal: controller.signal }),
        ]);
        if (!detailRes.ok) throw new Error(t("loadFailed"));
        const detail = (await detailRes.json()) as { item?: FormSubmission; related?: FormSubmission[] };
        if (!detail.item) throw new Error(t("loadFailed"));
        setItem(detail.item);
        setRelated(detail.related ?? []);
        if (actRes.ok) {
          const data = (await actRes.json()) as { activities?: FormActivity[] };
          setActivities(data.activities ?? []);
        }
        if (staffRes.ok) {
          const data = (await staffRes.json()) as { users?: StaffOption[] };
          setStaff(data.users ?? []);
        }
        setError(null);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof Error ? err.message : t("loadFailed"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [params.id, t, retryKey]);

  const listHref = item?.type === "quote" ? "/admin/forms/quotes" : "/admin/forms/contact";

  return (
    <Can module="forms" action="view" fallback={<AccessDenied />}>
      <AdminPageHeader
        title={item ? leadName(item) : t("detail.title")}
        description={item ? new Date(item.createdAt).toLocaleString() : undefined}
      />
      <div className="mb-4">
        <Button type="button" variant="ghost" onClick={() => router.push(listHref)}>
          {tCommon("back")}
        </Button>
      </div>
      {loading ? <FormSkeleton /> : null}
      {error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            setRetryKey((k) => k + 1);
          }}
        />
      ) : null}
      {item && !loading ? (
        <div className="rounded-xl border border-border/60 bg-white p-5">
          <LeadDetail
            submission={item}
            related={related}
            activities={activities}
            staff={staff}
            canEdit={can("forms", "edit")}
            canDelete={can("forms", "delete")}
            onUpdated={(next) => setItem(next)}
          />
        </div>
      ) : null}
    </Can>
  );
}
