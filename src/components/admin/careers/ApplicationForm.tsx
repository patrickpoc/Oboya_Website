"use client";

import { useEffect, useId, useRef } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "./Field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  APPLICATION_SOURCES,
  LANGUAGE_LEVELS,
  SALARY_PERIODS,
  WORK_AUTHORIZATIONS,
  WORK_MODELS,
  type JobApplication,
  type JobOpening,
} from "@/lib/cms/careers/types";
import { WORLD_COUNTRIES } from "@/lib/contact/world-countries";

const SELECT = "h-9 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-oboya-blue";

export function ApplicationForm({
  application,
  onChange,
  openings,
  errors,
  duplicateEmail,
  sidebar,
}: {
  application: JobApplication;
  onChange: (next: JobApplication) => void;
  openings: JobOpening[];
  errors: string[];
  duplicateEmail: boolean;
  sidebar?: React.ReactNode;
}) {
  const errorRef = useRef<HTMLUListElement>(null);
  const duplicateId = useId();
  const format = useFormatter();
  useEffect(() => {
    if (errors.length > 0) errorRef.current?.focus();
  }, [errors]);
  const t = useTranslations("admin.careers.applications");
  const tc = useTranslations("admin.careers.common");
  const f = (key: string) => t(`detail.fields.${key}`);
  const set = (patch: Partial<JobApplication>) => onChange({ ...application, ...patch });
  const str = (key: keyof JobApplication) => (
    <Input
      value={(application[key] as string | undefined) ?? ""}
      onChange={(e) => set({ [key]: e.target.value || undefined } as Partial<JobApplication>)}
    />
  );
  const num = (key: keyof JobApplication, props: React.ComponentProps<typeof Input> = {}) => (
    <Input
      type="number"
      min={0}
      {...props}
      value={(application[key] as number | undefined) ?? ""}
      onChange={(e) => set({ [key]: e.target.value === "" ? undefined : Number(e.target.value) } as Partial<JobApplication>)}
    />
  );
  const enumSelect = (
    key: keyof JobApplication,
    values: readonly string[],
    label: (v: string) => string
  ) => (
    <select
      className={SELECT}
      value={(application[key] as string | undefined) ?? ""}
      onChange={(e) => set({ [key]: e.target.value || undefined } as Partial<JobApplication>)}
    >
      <option value="">—</option>
      {values.map((v) => (
        <option key={v} value={v}>
          {label(v)}
        </option>
      ))}
    </select>
  );

  const setLanguage = (index: number, patch: Partial<JobApplication["languages"][number]>) =>
    set({ languages: application.languages.map((l, i) => (i === index ? { ...l, ...patch } : l)) });

  return (
    <div className="space-y-6">
      {errors.length > 0 ? (
        <ul ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg border border-oboya-orange/40 bg-oboya-orange/5 p-3 text-sm text-oboya-orange">
          {errors.map((code) => (
            <li key={code}>{t.has(`detail.validation.${code}`) ? t(`detail.validation.${code}`) : code}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <Card className="min-w-0 xl:col-start-1">
        <CardHeader>
          <CardTitle>{t("detail.sections.candidate")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={f("opening")} className="sm:col-span-2">
            <select
              className={SELECT}
              value={application.openingId ?? ""}
              onChange={(e) => set({ openingId: e.target.value || null })}
            >
              <option value="">{t("filters.talentPool")}</option>
              {openings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title.en || o.slug}
                </option>
              ))}
            </select>
          </Field>
          <Field label={f("fullName")}>{str("fullName")}</Field>
          <Field label={f("email")}>
            <Input type="email" aria-describedby={duplicateEmail ? duplicateId : undefined} value={application.email} onChange={(e) => set({ email: e.target.value })} />
            {duplicateEmail ? <p id={duplicateId} className="text-xs text-oboya-orange">{t("duplicateEmailWarning")}</p> : null}
          </Field>
          <Field label={f("phone")}>{str("phone")}</Field>
          <Field label={f("country")}>
            <select
              className={SELECT}
              value={application.countryCode ?? ""}
              onChange={(e) => set({ countryCode: e.target.value || undefined })}
            >
              <option value="">—</option>
              {WORLD_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={f("city")}>{str("city")}</Field>
          <Field label={f("linkedinUrl")}>{str("linkedinUrl")}</Field>
          <Field label={f("portfolioUrl")}>{str("portfolioUrl")}</Field>
        </CardContent>
      </Card>

      {sidebar ? <aside className="min-w-0 space-y-6 xl:col-start-2 xl:row-start-1 xl:row-span-4">{sidebar}</aside> : null}

      <Card className="min-w-0 xl:col-start-1">
        <CardHeader>
          <CardTitle>{t("detail.sections.professional")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={f("currentCompany")}>{str("currentCompany")}</Field>
          <Field label={f("currentTitle")}>{str("currentTitle")}</Field>
          <Field label={f("yearsExperience")}>{num("yearsExperience", { step: 0.5, max: 70 })}</Field>
          <Field label={f("source")}>
            {enumSelect("source", APPLICATION_SOURCES, (v) => tc(`source.${v}`))}
          </Field>
          <Field label={f("sourceDetail")}>{str("sourceDetail")}</Field>
          <Field label={f("referrerName")}>{str("referrerName")}</Field>
          <div role="group" aria-label={f("languages")} className="space-y-2 sm:col-span-2">
            <Label>{f("languages")}</Label>
            {application.languages.map((lang, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="w-24"
                  maxLength={10}
                  value={lang.code}
                  onChange={(e) => setLanguage(i, { code: e.target.value.toLowerCase() })}
                />
                <select
                  className={SELECT}
                  value={lang.level}
                  onChange={(e) => setLanguage(i, { level: e.target.value as typeof lang.level })}
                >
                  {LANGUAGE_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {tc(`languageLevel.${l}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded p-1 hover:bg-muted"
                  aria-label={tc("remove")}
                  onClick={() => set({ languages: application.languages.filter((_, j) => j !== i) })}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => set({ languages: [...application.languages, { code: "", level: "B2" }] })}
            >
              <Plus className="size-3.5" />
              {f("addLanguage")}
            </Button>
          </div>
          <Field label={f("coverLetter")} className="sm:col-span-2">
            <textarea
              rows={5}
              value={application.coverLetter ?? ""}
              onChange={(e) => set({ coverLetter: e.target.value || undefined })}
              className="w-full rounded-lg border border-input px-3 py-2 text-sm"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="min-w-0 xl:col-start-1">
        <CardHeader>
          <CardTitle>{t("detail.sections.preferences")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label={f("salaryExpectation")}>{num("salaryExpectation")}</Field>
          <Field label={f("salaryCurrency")}>
            <Input
              maxLength={3}
              value={application.salaryCurrency ?? ""}
              onChange={(e) => set({ salaryCurrency: e.target.value.toUpperCase() || undefined })}
            />
          </Field>
          <Field label={f("salaryPeriod")}>
            {enumSelect("salaryPeriod", SALARY_PERIODS, (v) => tc(`salaryPeriod.${v}`))}
          </Field>
          <Field label={f("availabilityDate")}>
            <Input
              type="date"
              value={application.availabilityDate ?? ""}
              onChange={(e) => set({ availabilityDate: e.target.value || undefined })}
            />
          </Field>
          <Field label={f("noticePeriodDays")}>{num("noticePeriodDays")}</Field>
          <Field label={f("workAuthorization")}>
            {enumSelect("workAuthorization", WORK_AUTHORIZATIONS, (v) => tc(`workAuthorization.${v}`))}
          </Field>
          <Field label={f("remotePreference")}>
            {enumSelect("remotePreference", WORK_MODELS, (v) => tc(`workModel.${v}`))}
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Switch
              checked={application.willingToRelocate === true}
              onCheckedChange={(checked) => set({ willingToRelocate: checked })}
            />
            {f("willingToRelocate")}
          </label>
        </CardContent>
      </Card>

      <Card className="min-w-0 xl:col-start-1">
        <CardHeader>
          <CardTitle>{t("detail.sections.consent")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <fieldset disabled className="contents">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Switch
              checked={application.consentPrivacy}
              onCheckedChange={(checked) => set({ consentPrivacy: checked })}
            />
            {f("consentPrivacy")}
          </label>
          <Field label={f("consentVersion")}>
            <Input
              disabled
              value={application.consentVersion ?? ""}
              onChange={(e) => set({ consentVersion: e.target.value || undefined })}
            />
          </Field>
          {application.consentPrivacyAt ? (
            <Field label={f("consentAt")}>
              <p className="text-sm">{format.dateTime(new Date(application.consentPrivacyAt), { dateStyle: "medium", timeStyle: "short" })}</p>
            </Field>
          ) : null}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Switch
              checked={application.consentTalentPool}
              onCheckedChange={(checked) => set({ consentTalentPool: checked })}
            />
            {f("consentTalentPool")}
          </label>
        </fieldset>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
