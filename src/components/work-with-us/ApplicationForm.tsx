"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2, Upload } from "lucide-react";
import {
  CharCount,
  CountrySelect,
  OTHER_COUNTRY_CODE,
  PhoneCountrySelect,
  underlineField,
} from "@/components/contact/ContactFieldControls";
import { Link, useRouter } from "@/i18n/navigation";
import { HEARD_FROM_OPTIONS, PUBLIC_APPLY_LIMITS } from "@/lib/cms/careers/public-apply";
import {
  LANGUAGE_LEVELS,
  SALARY_PERIODS,
  WORK_AUTHORIZATIONS,
  WORK_MODELS,
  type LanguageLevel,
} from "@/lib/cms/careers/types";
import { CV_MAX_BYTES, CV_MIME_TYPES, isValidHttpUrl, validateCvFile } from "@/lib/cms/careers/validation";
import { getWorldCountryByCode } from "@/lib/contact/world-countries";
import { cn } from "@/lib/utils";
import { formatBytes, languageName } from "./opening-format";

const LANGUAGE_CODES = ["en", "pt", "es", "zh", "fr", "de", "it", "nl", "sv", "no", "pl", "ru", "ar", "hi", "ja", "ko", "tr"];
const CURRENCIES = ["USD", "EUR", "BRL", "GBP", "CNY", "SEK", "NOK", "PLN", "AED", "INR", "MXN"];
const MAX_LANGUAGES = 10;
const FIELD_ORDER = [
  "fullName", "email", "phone", "countryCode", "linkedinUrl", "portfolioUrl", "yearsExperience",
  "salaryExpectation", "availabilityDate", "noticePeriodDays", "coverLetter", "cv", "consentPrivacy",
] as const;

type Phase = "idle" | "submitting" | "uploading" | "confirming" | "done";
type Pending = { applicationId: string; uploadUrl: string; path: string; ticket: string; uploaded?: boolean };
type Lang = { code: string; level: LanguageLevel };
type Errors = Record<string, string>;

const initial = {
  fullName: "", email: "", phoneLocal: "", city: "", linkedinUrl: "", portfolioUrl: "", currentCompany: "",
  currentTitle: "", yearsExperience: "", salaryExpectation: "", salaryCurrency: "USD", salaryPeriod: "month",
  availabilityDate: "", noticePeriodDays: "", workAuthorization: "", willingToRelocate: "", remotePreference: "",
  coverLetter: "", heardFrom: "", referrerName: "",
};
type Values = typeof initial;

/** Server validation codes -> form field. */
const SERVER_FIELD: Record<string, [string, string]> = {
  nameRequired: ["fullName", "required"],
  emailInvalid: ["email", "emailInvalid"],
  consentRequired: ["consentPrivacy", "consentRequired"],
  urlInvalid: ["linkedinUrl", "urlInvalid"],
  yearsRange: ["yearsExperience", "yearsRange"],
  noticeRange: ["noticePeriodDays", "noticeRange"],
  dateInvalid: ["availabilityDate", "dateInvalid"],
  salaryNegative: ["salaryExpectation", "yearsRange"],
  phoneRequired: ["phone", "required"],
  countryRequired: ["countryCode", "required"],
  cvRequired: ["cv", "cvRequired"],
  cvType: ["cv", "cvType"],
  invalidType: ["cv", "cvType"],
  cvTooLarge: ["cv", "cvTooLarge"],
  tooLarge: ["cv", "cvTooLarge"],
  coverLetterTooLong: ["coverLetter", "coverLetterTooLong"],
};

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { res, data };
}

export function ApplicationForm({ opening }: { opening: { slug: string; title: string } | null }) {
  const t = useTranslations("workWithUsPage.apply");
  const tl = useTranslations("workWithUsPage.labels");
  const tc = useTranslations("contact");
  const locale = useLocale();
  const router = useRouter();

  const [v, setV] = useState<Values>(initial);
  const [countryCode, setCountryCode] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("US");
  const [languages, setLanguages] = useState<Lang[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentTalentPool, setConsentTalentPool] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<Pending | null>(null);

  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (phase === "done") successRef.current?.focus();
  }, [phase]);

  const succeed = () => {
    setPhase("done");
    router.replace(opening ? `/work/${opening.slug}/apply/thanks` : "/work/apply/thanks");
  };

  const busy = phase === "submitting" || phase === "uploading" || phase === "confirming";
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));
  const field = (k: keyof Values, name: string = k) => ({
    id: `apply-${name}`,
    name,
    value: v[k],
    onChange: set(k),
    className: underlineField,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `apply-${name}-error` : undefined,
  });

  function validate(): Errors {
    const e: Errors = {};
    if (!v.fullName.trim()) e.fullName = "required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "emailInvalid";
    if (!v.phoneLocal.trim()) e.phone = "required";
    if (!countryCode || countryCode === OTHER_COUNTRY_CODE) e.countryCode = "required";
    for (const k of ["linkedinUrl", "portfolioUrl"] as const) {
      if (v[k].trim() && !isValidHttpUrl(v[k])) e[k] = "urlInvalid";
    }
    const years = num(v.yearsExperience);
    if (years !== undefined && !(years >= 0 && years <= 70)) e.yearsExperience = "yearsRange";
    const salary = num(v.salaryExpectation);
    if (salary !== undefined && !(salary >= 0)) e.salaryExpectation = "yearsRange";
    const notice = num(v.noticePeriodDays);
    if (notice !== undefined && !(Number.isInteger(notice) && notice >= 0)) e.noticePeriodDays = "noticeRange";
    if (v.coverLetter.length > PUBLIC_APPLY_LIMITS.coverLetterChars) e.coverLetter = "coverLetterTooLong";
    if (!file) e.cv = "cvRequired";
    else {
      const check = validateCvFile(file.type.toLowerCase(), file.size);
      if (!check.ok) e.cv = check.errors.includes("invalidType") ? "cvType" : "cvTooLarge";
    }
    if (!consentPrivacy) e.consentPrivacy = "consentRequired";
    return e;
  }

  function showErrors(e: Errors) {
    setErrors(e);
    const first = FIELD_ORDER.find((k) => e[k]);
    if (first) window.requestAnimationFrame(() => document.getElementById(`apply-${first}`)?.focus());
  }

  async function finish(p: Pending) {
    if (!file) return;
    setFormError(null);
    if (!p.uploaded) {
      setPhase("uploading");
      try {
        const put = await fetch(p.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type.toLowerCase() }, body: file });
        if (!put.ok) throw new Error("upload");
        p = { ...p, uploaded: true };
      } catch {
        setPending(p);
        setPhase("idle");
        setFormError("uploadFailed");
        return;
      }
    }
    setPhase("confirming");
    try {
      const { res, data } = await postJson("/api/careers/apply/confirm", {
        applicationId: p.applicationId,
        path: p.path,
        ticket: p.ticket,
      });
      if (res.ok) {
        setPending(null);
        succeed();
        return;
      }
      const code = String(data?.error ?? "");
      if (code === "invalidType" || code === "cvTooLarge" || code === "tooLarge") {
        setPending(null);
        setFile(null);
        showErrors({ cv: code === "invalidType" ? "cvType" : "cvTooLarge" });
      } else if (code === "invalidTicket" || code === "cv_not_uploaded") {
        setPending(null);
        setFile(null);
        setFormError("invalidTicket");
      } else if (code === "openingClosed") {
        setPending(null);
        setFormError(code);
      } else {
        setPending(p);
        setFormError("uploadFailed");
      }
    } catch {
      setPending(p);
      setFormError("uploadFailed");
    }
    setPhase("idle");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (pending) return finish(pending);
    setFormError(null);
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length || !file) {
      showErrors(local);
      return;
    }

    setPhase("submitting");
    const dial = getWorldCountryByCode(phoneCountry)?.dial ?? "+1";
    const salary = num(v.salaryExpectation);
    const body = {
      openingSlug: opening?.slug ?? null,
      fullName: v.fullName.trim(),
      email: v.email.trim(),
      phone: `${dial} ${v.phoneLocal.trim().replace(/^0+/, "")}`,
      countryCode,
      city: v.city.trim() || undefined,
      linkedinUrl: v.linkedinUrl.trim() || undefined,
      portfolioUrl: v.portfolioUrl.trim() || undefined,
      currentCompany: v.currentCompany.trim() || undefined,
      currentTitle: v.currentTitle.trim() || undefined,
      yearsExperience: num(v.yearsExperience),
      salaryExpectation: salary,
      salaryCurrency: salary !== undefined ? v.salaryCurrency : undefined,
      salaryPeriod: salary !== undefined ? v.salaryPeriod : undefined,
      availabilityDate: v.availabilityDate || undefined,
      noticePeriodDays: num(v.noticePeriodDays),
      workAuthorization: v.workAuthorization || undefined,
      willingToRelocate: v.willingToRelocate === "" ? undefined : v.willingToRelocate === "yes",
      remotePreference: v.remotePreference || undefined,
      languages,
      coverLetter: v.coverLetter.trim() || undefined,
      heardFrom: v.heardFrom || undefined,
      referrerName: v.heardFrom === "referral" ? v.referrerName.trim() || undefined : undefined,
      consentPrivacy: true,
      consentTalentPool,
      cv: { name: file.name, mime: file.type.toLowerCase(), size: file.size },
      website: honeypot.current?.value ?? "",
      startedAt: startedAt.current,
      locale,
    };

    try {
      const { res, data } = await postJson("/api/careers/apply", body);
      if (!res.ok) {
        const code = String(data?.error ?? "");
        if (code === "validation" && Array.isArray(data?.fields)) {
          const mapped: Errors = {};
          for (const f of data.fields as string[]) {
            const hit = SERVER_FIELD[f];
            if (f === "urlInvalid") {
              const bad = v.linkedinUrl.trim() && !isValidHttpUrl(v.linkedinUrl) ? "linkedinUrl" : v.portfolioUrl.trim() ? "portfolioUrl" : "linkedinUrl";
              mapped[bad] = "urlInvalid";
            } else if (hit) mapped[hit[0]] = hit[1];
          }
          showErrors(mapped);
          setFormError("validation");
        } else {
          setFormError(["rateLimited", "openingClosed"].includes(code) ? code : "generic");
        }
        setPhase("idle");
        return;
      }
      if (typeof data?.applicationId !== "string") {
        succeed();
        return;
      }
      await finish(data as unknown as Pending);
    } catch {
      setFormError("generic");
      setPhase("idle");
    }
  }

  if (phase === "done") {
    return (
      <div className="rounded-xl border border-oboya-green/30 bg-oboya-green/5 px-6 py-8" role="status">
        <h2 ref={successRef} tabIndex={-1} className="font-display text-2xl font-semibold text-oboya-blue-dark outline-none">
          {t("success.title")}
        </h2>
        <p className="mt-3 text-sm text-oboya-blue-dark/80">{t("success.description")}</p>
        {!opening || consentTalentPool ? <p className="mt-2 text-sm text-oboya-blue-dark/80">{t("success.talentPoolNote")}</p> : null}
        <Link
          href="/work"
          className="mt-6 inline-flex min-h-11 items-center rounded-full border border-oboya-blue-dark px-6 text-sm font-semibold tracking-wider text-oboya-blue-dark uppercase hover:bg-oboya-blue-dark hover:text-white"
        >
          {t("success.backToOpenings")}
        </Link>
      </div>
    );
  }

  const errorText = (name: string) =>
    errors[name] ? (
      <p id={`apply-${name}-error`} className="text-xs text-oboya-orange">
        {t(`validation.${errors[name]}` as never)}
      </p>
    ) : null;
  const label = (key: string, name: string, required = false) => (
    <label htmlFor={`apply-${name}`} className="text-sm font-semibold text-oboya-blue-dark">
      {t(`fields.${key}` as never)}
      {required ? <span aria-hidden> *</span> : <span className="ml-1 text-xs font-normal text-oboya-blue-dark/50">({t("fields.optional")})</span>}
    </label>
  );
  const row = "grid gap-8 lg:grid-cols-2";
  const col = "flex flex-col gap-2";
  const legend = "mb-6 font-display text-lg font-semibold text-oboya-blue-dark";
  const checkbox = "mt-0.5 size-4 shrink-0 accent-oboya-blue-dark";
  const cvError = errors.cv;

  return (
    <form className="flex flex-col gap-10" onSubmit={onSubmit} noValidate>
      <fieldset disabled={busy || !!pending} className="flex min-w-0 flex-col gap-10">
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <section>
          <h2 className={legend}>{t("sections.personal")}</h2>
          <div className="flex flex-col gap-8">
            <div className={row}>
              <div className={col}>
                {label("fullName", "fullName", true)}
                <input {...field("fullName")} type="text" required autoComplete="name" maxLength={160} />
                {errorText("fullName")}
              </div>
              <div className={col}>
                {label("email", "email", true)}
                <input {...field("email")} type="email" required autoComplete="email" maxLength={254} />
                {errorText("email")}
              </div>
            </div>
            <div className={row}>
              <div className={col}>
                {label("phone", "phone", true)}
                <div className="flex items-end gap-3">
                  <PhoneCountrySelect
                    value={phoneCountry}
                    onChange={setPhoneCountry}
                    label={t("fields.phoneCountry")}
                    searchPlaceholder={tc("phoneCountrySearch")}
                    emptyLabel={tc("phoneCountryEmpty")}
                    id="apply-phoneCountry"
                  />
                  <input
                    {...field("phoneLocal", "phone")}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    required
                    maxLength={30}
                    placeholder={tc("phoneLocalPlaceholder")}
                  />
                </div>
                {errorText("phone")}
              </div>
              <div className={col}>
                {label("country", "countryCode", true)}
                <CountrySelect
                  id="apply-countryCode"
                  value={countryCode}
                  onChange={setCountryCode}
                  label={t("fields.country")}
                  placeholder={tc("countryPlaceholder")}
                  otherLabel={tc("countryOther")}
                  searchPlaceholder={tc("countrySearch")}
                  emptyLabel={tc("countryEmpty")}
                />
                {errorText("countryCode")}
              </div>
            </div>
            <div className={row}>
              <div className={col}>
                {label("city", "city")}
                <input {...field("city")} type="text" autoComplete="address-level2" maxLength={120} />
              </div>
              <div className={col}>
                {label("linkedinUrl", "linkedinUrl")}
                <input {...field("linkedinUrl")} type="url" inputMode="url" placeholder="https://" maxLength={500} />
                {errorText("linkedinUrl")}
              </div>
            </div>
            <div className={col}>
              {label("portfolioUrl", "portfolioUrl")}
              <input {...field("portfolioUrl")} type="url" inputMode="url" placeholder="https://" maxLength={500} />
              {errorText("portfolioUrl")}
            </div>
          </div>
        </section>

        <section>
          <h2 className={legend}>{t("sections.professional")}</h2>
          <div className="flex flex-col gap-8">
            <div className={row}>
              <div className={col}>
                {label("currentCompany", "currentCompany")}
                <input {...field("currentCompany")} type="text" autoComplete="organization" maxLength={160} />
              </div>
              <div className={col}>
                {label("currentTitle", "currentTitle")}
                <input {...field("currentTitle")} type="text" autoComplete="organization-title" maxLength={160} />
              </div>
            </div>
            <div className={row}>
              <div className={col}>
                {label("yearsExperience", "yearsExperience")}
                <input {...field("yearsExperience")} type="number" inputMode="decimal" min={0} max={70} step="any" />
                {errorText("yearsExperience")}
              </div>
              <div className={col}>
                {label("salaryExpectation", "salaryExpectation")}
                <div className="flex flex-wrap items-end gap-3">
                  <input {...field("salaryExpectation")} type="number" inputMode="decimal" min={0} className={cn(underlineField, "min-w-32 flex-1")} />
                  <select {...field("salaryCurrency")} id="apply-salaryCurrency" aria-label={t("fields.salaryCurrency")} className={cn(underlineField, "w-24 shrink-0")}>
                    {CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <select {...field("salaryPeriod")} id="apply-salaryPeriod" aria-label={t("fields.salaryPeriod")} className={cn(underlineField, "w-28 shrink-0")}>
                    {SALARY_PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {tl(`salaryPeriod.${p}`)}
                      </option>
                    ))}
                  </select>
                </div>
                {errorText("salaryExpectation")}
              </div>
            </div>
            <div className={row}>
              <div className={col}>
                {label("availabilityDate", "availabilityDate")}
                <input {...field("availabilityDate")} type="date" />
                {errorText("availabilityDate")}
              </div>
              <div className={col}>
                {label("noticePeriodDays", "noticePeriodDays")}
                <input {...field("noticePeriodDays")} type="number" inputMode="numeric" min={0} step={1} />
                {errorText("noticePeriodDays")}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className={legend}>{t("sections.preferences")}</h2>
          <div className="flex flex-col gap-8">
            <div className={row}>
              <div className={col}>
                {label("workAuthorization", "workAuthorization")}
                <select {...field("workAuthorization")}>
                  <option value="" />
                  {WORK_AUTHORIZATIONS.map((w) => (
                    <option key={w} value={w}>
                      {tl(`workAuthorization.${w}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className={col}>
                {label("remotePreference", "remotePreference")}
                <select {...field("remotePreference")}>
                  <option value="" />
                  {WORK_MODELS.map((w) => (
                    <option key={w} value={w}>
                      {tl(`workModel.${w}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={row}>
              <div className={col}>
                {label("willingToRelocate", "willingToRelocate")}
                <select {...field("willingToRelocate")}>
                  <option value="" />
                  <option value="yes">{t("fields.yes")}</option>
                  <option value="no">{t("fields.no")}</option>
                </select>
              </div>
              <div className={col}>
                {label("heardFrom", "heardFrom")}
                <select {...field("heardFrom")}>
                  <option value="" />
                  {HEARD_FROM_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {t(`heardFrom.${h}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {v.heardFrom === "referral" ? (
              <div className={col}>
                {label("referrerName", "referrerName")}
                <input {...field("referrerName")} type="text" maxLength={160} />
              </div>
            ) : null}
            <div className={col}>
              {label("coverLetter", "coverLetter")}
              <textarea {...field("coverLetter")} rows={5} className={cn(underlineField, "resize-none")} />
              <CharCount remaining={PUBLIC_APPLY_LIMITS.coverLetterChars - v.coverLetter.length} />
              {errorText("coverLetter")}
            </div>
          </div>
        </section>

        <section>
          <h2 className={legend}>{t("sections.languages")}</h2>
          <div className="flex flex-col gap-4">
            {languages.map((l, i) => (
              <div key={i} className="flex items-end gap-3">
                <select
                  aria-label={t("fields.languageCode")}
                  value={l.code}
                  onChange={(e) => setLanguages((prev) => prev.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))}
                  className={underlineField}
                >
                  {LANGUAGE_CODES.map((c) => (
                    <option key={c} value={c}>
                      {languageName(c, locale)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t("fields.languageLevel")}
                  value={l.level}
                  onChange={(e) =>
                    setLanguages((prev) => prev.map((x, j) => (j === i ? { ...x, level: e.target.value as LanguageLevel } : x)))
                  }
                  className={underlineField}
                >
                  {LANGUAGE_LEVELS.map((lv) => (
                    <option key={lv} value={lv}>
                      {tl(`languageLevel.${lv}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={t("fields.removeLanguage")}
                  onClick={() => setLanguages((prev) => prev.filter((_, j) => j !== i))}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-oboya-blue-dark/60 hover:bg-oboya-soft-white hover:text-oboya-orange"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            {languages.length < MAX_LANGUAGES ? (
              <button
                type="button"
                onClick={() => setLanguages((prev) => [...prev, { code: "en", level: "B2" }])}
                className="inline-flex min-h-10 w-fit items-center gap-2 text-sm font-medium text-oboya-blue underline-offset-2 hover:underline"
              >
                <Plus className="size-4" aria-hidden />
                {t("fields.addLanguage")}
              </button>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className={legend}>{t("sections.documents")}</h2>
          <label
            htmlFor="apply-cv"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) setFile(dropped);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-sm border-2 border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-oboya-blue",
              cvError ? "border-oboya-orange" : "border-oboya-blue-dark/25 hover:border-oboya-blue-dark/60"
            )}
          >
            <Upload className="size-6 text-oboya-green" aria-hidden />
            <span className="text-sm font-semibold text-oboya-blue-dark">
              {t("fields.cv")} <span aria-hidden>*</span>
            </span>
            <span className="text-sm text-oboya-blue-dark/80">
              {file ? t("fields.cvSelected", { name: file.name, size: formatBytes(file.size) }) : t("fields.cvDrop")}
            </span>
            {file ? <span className="text-xs font-medium text-oboya-blue underline">{t("fields.cvReplace")}</span> : null}
            <span className="text-xs text-oboya-blue-dark/60">{t("fields.cvHint", { size: formatBytes(CV_MAX_BYTES) })}</span>
            <input
              id="apply-cv"
              name="cv"
              type="file"
              accept={CV_MIME_TYPES.join(",") + ",.pdf,.doc,.docx"}
              required
              className="sr-only"
              aria-invalid={cvError ? true : undefined}
              aria-describedby={cvError ? "apply-cv-error" : undefined}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="mt-2">
            {errorText("cv")}
          </div>
        </section>

        <section>
          <h2 className={legend}>{t("sections.consent")}</h2>
          <div className="flex flex-col gap-3">
            <p className="text-xs leading-relaxed text-oboya-blue-dark/70">
              {t("fields.privacyNotice")}{" "}
              <Link href="/privacy#recruitment" className="text-oboya-blue-light underline-offset-2 hover:underline">
                {t("fields.privacyLink")}
              </Link>
            </p>
            <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
              <input
                id="apply-consentPrivacy"
                type="checkbox"
                required
                checked={consentPrivacy}
                onChange={(e) => setConsentPrivacy(e.target.checked)}
                aria-invalid={errors.consentPrivacy ? true : undefined}
                aria-describedby={errors.consentPrivacy ? "apply-consentPrivacy-error" : undefined}
                className={checkbox}
              />
              <span>{t("fields.consentPrivacy")} *</span>
            </label>
            {errorText("consentPrivacy")}
            <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
              <input
                type="checkbox"
                checked={consentTalentPool}
                onChange={(e) => setConsentTalentPool(e.target.checked)}
                className={checkbox}
              />
              <span>{t("fields.consentTalentPool")}</span>
            </label>
          </div>
        </section>
      </fieldset>

      <div className="flex flex-col gap-3">
        <div aria-live="polite" className="flex flex-col gap-3">
          {busy ? <p className="text-sm text-oboya-blue-dark/80">{t(`status.${phase}` as never)}</p> : null}
          {formError ? (
            <p className="text-sm text-oboya-orange">
              {formError === "validation" ? t("validation.summary") : t(`errors.${formError}` as never)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 w-full rounded-full border border-oboya-blue-dark px-8 py-2.5 text-sm font-semibold tracking-wider text-oboya-blue-dark uppercase transition-colors hover:bg-oboya-blue-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue disabled:opacity-60 sm:w-auto"
          >
            {busy ? t(`status.${phase}` as never) : pending ? t("status.retryUpload") : t("submit")}
          </button>
        </div>
      </div>
    </form>
  );
}
