"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function FormPiiActions({
  id,
  onDone,
}: {
  id: string;
  onDone: () => void;
}) {
  const t = useTranslations("admin.forms.pii");
  const tCommon = useTranslations("admin.common");

  const run = async (anonymize: boolean) => {
    const confirmed = window.confirm(
      anonymize ? t("confirmAnonymize") : t("confirmDelete")
    );
    if (!confirmed) return;
    try {
      const params = new URLSearchParams({ id });
      if (anonymize) params.set("anonymize", "1");
      const res = await fetch(`/api/cms/forms?${params.toString()}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? tCommon("requestFailed"));
      }
      toast.success(anonymize ? t("anonymized") : t("deleted"));
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("couldNotUpdate"));
    }
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => void run(true)}>
        {t("anonymize")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-oboya-orange"
        onClick={() => void run(false)}
      >
        {tCommon("delete")}
      </Button>
    </>
  );
}
