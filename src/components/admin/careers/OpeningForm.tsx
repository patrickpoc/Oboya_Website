"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RichTextEditor } from "@/components/admin/editors/RichTextEditor";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { Can } from "@/components/admin/permissions/Can";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/lib/cms/slugify";
import type { CmsLocale, CmsUser } from "@/lib/cms/types";
import {
  EMPLOYMENT_TYPES,
  OPENING_STATUSES,
  SALARY_PERIODS,
  SENIORITIES,
  WORK_MODELS,
  type JobOpening,
  type OpeningLocalizedField,
} from "@/lib/cms/careers/types";
import { WORLD_COUNTRIES } from "@/lib/contact/world-countries";
import { Field } from "./Field";
import { OpeningStatusPill } from "./OpeningStatusPill";

const SELECT = "h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm";
const RICH_FIELDS: OpeningLocalizedField[] = [
  "description",
  "responsibilities",
  "requirements",
  "niceToHave",
  "benefits",
];

/** ISO <-> value of <input type="datetime-local"> (browser local time). */
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : undefined);

function OwnerField({
  label,
  users,
  id,
  name,
  onChange,
}: {
  label: string;
  users: CmsUser[];
  id?: string;
  name?: string;
  onChange: (id?: string, name?: string) => void;
}) {
  if (users.length === 0) {
    return (
      <Field label={label}>
        <Input value={name ?? ""} onChange={(e) => onChange(undefined, e.target.value || undefined)} />
      </Field>
    );
  }
  return (
    <Field label={label}>
      <select
        className={SELECT}
        value={id ?? ""}
        onChange={(e) => {
          const user = users.find((u) => u.id === e.target.value);
          onChange(user?.id, user?.name);
        }}
      >
        <option value="">—</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function OpeningForm({
  opening,
  onChange,
  users,
  errors,
  readOnly = false,
}: {
  readOnly?: boolean;
  opening: JobOpening;
  onChange: (next: JobOpening) => void;
  users: CmsUser[];
  errors: string[];
}) {
  const t = useTranslations("admin.careers.openings.editor");
  const tc = useTranslations("admin.careers.common");
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [slugTouched, setSlugTouched] = useState(Boolean(opening.slug));
  const set = (patch: Partial<JobOpening>) => onChange({ ...opening, ...patch });
  const setLoc = (field: OpeningLocalizedField, loc: CmsLocale, value: string) =>
    set({ [field]: { ...opening[field], [loc]: value } } as Partial<JobOpening>);
  const num = (v: string) => (v === "" ? undefined : Number(v));
  const f = (key: string) => t(`fields.${key}`);

  const enumSelect = (
    value: string | undefined,
    values: readonly string[],
    ns: "workModel" | "employmentType" | "seniority" | "salaryPeriod",
    onPick: (v: string | undefined) => void
  ) => (
    <select className={SELECT} value={value ?? ""} onChange={(e) => onPick(e.target.value || undefined)}>
      <option value="">—</option>
      {values.map((v) => (
        <option key={v} value={v}>
          {tc(`${ns}.${v}`)}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      {errors.length > 0 ? (
        <ul role="alert" className="rounded-lg border border-oboya-orange/40 bg-oboya-orange/5 p-3 text-sm text-oboya-orange">
          {errors.map((code) => (
            <li key={code}>{t.has(`validation.${code}`) ? t(`validation.${code}`) : code}</li>
          ))}
        </ul>
      ) : null}

      <fieldset disabled={readOnly} className="contents">
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.basics")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={f("slug")}>
            <Input
              value={opening.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set({ slug: slugify(e.target.value) });
              }}
            />
          </Field>
          <Field label={f("department")}>
            <Input value={opening.department ?? ""} onChange={(e) => set({ department: e.target.value || undefined })} />
          </Field>
          <Field label={f("employmentType")}>
            {enumSelect(opening.employmentType, EMPLOYMENT_TYPES, "employmentType", (v) =>
              set({ employmentType: v as JobOpening["employmentType"] })
            )}
          </Field>
          <Field label={f("seniority")}>
            {enumSelect(opening.seniority, SENIORITIES, "seniority", (v) => set({ seniority: v as JobOpening["seniority"] }))}
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.location")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label={f("country")}>
            <select
              className={SELECT}
              value={opening.countryCode ?? ""}
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
          <Field label={f("city")}>
            <Input value={opening.city ?? ""} onChange={(e) => set({ city: e.target.value || undefined })} />
          </Field>
          <Field label={f("workModel")}>
            {enumSelect(opening.workModel, WORK_MODELS, "workModel", (v) => set({ workModel: v as JobOpening["workModel"] }))}
          </Field>
        </CardContent>
      </Card>

      </fieldset>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.content")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LocaleFieldTabs value={locale} onChange={setLocale}>
            {(loc) => (
              <div className="space-y-4">
                <Field label={f("title")}>
                  <Input
                    disabled={readOnly}
                    value={opening.title[loc]}
                    onChange={(e) => {
                      const patch: Partial<JobOpening> = { title: { ...opening.title, [loc]: e.target.value } };
                      if (loc === "en" && !slugTouched) patch.slug = slugify(e.target.value);
                      set(patch);
                    }}
                  />
                </Field>
                <Field label={f("summary")}>
                  <textarea
                    rows={3}
                    disabled={readOnly}
                    value={opening.summary[loc]}
                    onChange={(e) => setLoc("summary", loc, e.target.value)}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                  />
                </Field>
                {RICH_FIELDS.map((field) => (
                  <Field key={field} label={f(field)}>
                    <div inert={readOnly}>
                      <RichTextEditor value={opening[field][loc]} onChange={(html) => setLoc(field, loc, html)} />
                    </div>
                  </Field>
                ))}
              </div>
            )}
          </LocaleFieldTabs>
        </CardContent>
      </Card>

      <fieldset disabled={readOnly} className="contents">
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.compensation")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <Field label={f("salaryMin")}>
            <Input type="number" min={0} value={opening.salaryMin ?? ""} onChange={(e) => set({ salaryMin: num(e.target.value) })} />
          </Field>
          <Field label={f("salaryMax")}>
            <Input type="number" min={0} value={opening.salaryMax ?? ""} onChange={(e) => set({ salaryMax: num(e.target.value) })} />
          </Field>
          <Field label={f("salaryCurrency")}>
            <Input
              maxLength={3}
              value={opening.salaryCurrency ?? ""}
              onChange={(e) => set({ salaryCurrency: e.target.value.toUpperCase() || undefined })}
            />
          </Field>
          <Field label={f("salaryPeriod")}>
            {enumSelect(opening.salaryPeriod, SALARY_PERIODS, "salaryPeriod", (v) =>
              set({ salaryPeriod: v as JobOpening["salaryPeriod"] })
            )}
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-4">
            <Switch checked={opening.showSalary} onCheckedChange={(checked) => set({ showSalary: checked })} />
            {f("showSalary")}
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.publishing")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={f("status")}>
            <Can module="careers" action="publish" fallback={<OpeningStatusPill status={opening.status} />}>
              <select
                className={SELECT}
                value={opening.status}
                onChange={(e) => set({ status: e.target.value as JobOpening["status"] })}
              >
                {OPENING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {tc(`status.${s}`)}
                  </option>
                ))}
              </select>
            </Can>
          </Field>
          <Field label={f("positions")}>
            <Input
              type="number"
              min={1}
              value={opening.positions}
              onChange={(e) => set({ positions: Math.trunc(Number(e.target.value)) || 0 })}
            />
          </Field>
          <Field label={f("publishAt")}>
            <Input
              type="datetime-local"
              value={toLocalInput(opening.publishAt)}
              onChange={(e) => set({ publishAt: fromLocalInput(e.target.value) })}
            />
          </Field>
          <Field label={f("closeAt")}>
            <Input
              type="datetime-local"
              value={toLocalInput(opening.closeAt)}
              onChange={(e) => set({ closeAt: fromLocalInput(e.target.value) })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.ownership")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <OwnerField
            label={f("hiringManager")}
            users={users}
            id={opening.hiringManagerId}
            name={opening.hiringManagerName}
            onChange={(id, name) => set({ hiringManagerId: id, hiringManagerName: name })}
          />
          <OwnerField
            label={f("recruiter")}
            users={users}
            id={opening.recruiterId}
            name={opening.recruiterName}
            onChange={(id, name) => set({ recruiterId: id, recruiterName: name })}
          />
        </CardContent>
      </Card>
      </fieldset>
    </div>
  );
}
