"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@/components/admin/permissions/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CV_MIME_TYPES, validateCvFile } from "@/lib/cms/careers/validation";
import type { JobApplication } from "@/lib/cms/careers/types";
import { CareersApiError, getCvUrl, removeCv, uploadCv } from "./api";

const formatSize = (bytes?: number) => (bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : "");

export function CvUploadField({
  application,
  onChange,
}: {
  application: JobApplication;
  onChange: (next: JobApplication) => void;
}) {
  const t = useTranslations("admin.careers.applications");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const fail = (error: unknown) => {
    const code = error instanceof CareersApiError ? error.code : "";
    if (code === "cv_storage_unavailable") toast.error(t("detail.cv.unavailable"));
    else if (code === "invalidType" || code === "tooLarge") toast.error(t(`detail.cv.${code}`));
    else toast.error(t("toasts.cvUploadFailed"));
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const check = validateCvFile(file.type.toLowerCase(), file.size);
    if (!check.ok) {
      toast.error(t(`detail.cv.${check.errors[0] === "invalidType" ? "invalidType" : "tooLarge"}`));
      return;
    }
    setBusy(true);
    try {
      onChange(await uploadCv(application.id, file));
      toast.success(t("toasts.cvUploaded"));
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      window.location.assign(await getCvUrl(application.id));
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(t("confirm.removeCv", { name: application.fullName }))) return;
    setBusy(true);
    try {
      onChange(await removeCv(application.id));
      toast.success(t("toasts.cvRemoved"));
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("detail.sections.cv")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" aria-busy={busy}>
        {busy ? <p role="status" className="text-sm text-oboya-blue">{t("detail.cv.processing")}</p> : null}
        {application.cvPath ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex w-full min-w-0 items-start gap-2">
              <FileText className="mt-0.5 size-4 shrink-0 text-oboya-blue" />
              <div className="min-w-0">
                <p className="break-words font-medium">{application.cvFilename}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatSize(application.cvSize)}</p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={() => void handleDownload()}>
              <Download className="size-3.5" />
              {t("detail.cv.download")}
            </Button>
            <Can module="careers" action="edit">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                className="gap-1.5 text-oboya-orange"
                onClick={() => void handleRemove()}
              >
                <Trash2 className="size-3.5" />
                {t("detail.cv.remove")}
              </Button>
            </Can>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("detail.cv.none")}</p>
        )}
        <Can module="careers" action="edit">
          <input
            ref={input}
            type="file"
            hidden
            accept={CV_MIME_TYPES.join(",")}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <Button type="button" size="sm" disabled={busy} className="gap-1.5" onClick={() => input.current?.click()}>
            <Upload className="size-3.5" />
            {application.cvPath ? t("detail.cv.replace") : t("detail.cv.upload")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("detail.cv.hint")}</p>
        </Can>
      </CardContent>
    </Card>
  );
}
