"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  cityFacets,
  countryFacets,
  departmentFacets,
  employmentTypeFacets,
  filterPublicOpenings,
  salaryRangeFacets,
  seniorityFacets,
  SALARY_RANGE_IDS,
  type PublicJobOpening,
  type SalaryRangeId,
} from "@/lib/cms/careers/public";
import { EMPLOYMENT_TYPES, SENIORITIES, type Seniority } from "@/lib/cms/careers/types";
import { getWorldCountryByCode } from "@/lib/contact/world-countries";
import { cn } from "@/lib/utils";
import { OpeningCard } from "./OpeningCard";
import { countryName } from "./opening-format";

type Key = "country" | "q" | "city" | "department" | "employmentType" | "seniority" | "salary";

const selectClass =
  "h-11 w-full rounded-sm border border-border/70 bg-white px-3 text-sm text-oboya-blue-dark outline-none focus-visible:border-oboya-blue focus-visible:ring-2 focus-visible:ring-oboya-blue/30";

export function OpeningsList({ openings }: { openings: PublicJobOpening[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {openings.map((o) => (
        <OpeningCard key={o.slug} opening={o} />
      ))}
    </ul>
  );
}

export function OpeningsBoard({ openings }: { openings: PublicJobOpening[] }) {
  const t = useTranslations("workWithUsPage.board");
  const tl = useTranslations("workWithUsPage.labels");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const rawType = params.get("employmentType") ?? params.get("type") ?? "";
  const rawCountry = (params.get("country") ?? "").toUpperCase();
  const rawSeniority = params.get("seniority") ?? "";
  const rawSalary = params.get("salary") ?? "";
  const current: Record<Key, string> = {
    country: getWorldCountryByCode(rawCountry) ? rawCountry : "",
    q: params.get("q") ?? "",
    city: params.get("city") ?? "",
    department: params.get("department") ?? "",
    employmentType: (EMPLOYMENT_TYPES as readonly string[]).includes(rawType) ? rawType : "",
    seniority: (SENIORITIES as readonly string[]).includes(rawSeniority) ? rawSeniority : "",
    salary: (SALARY_RANGE_IDS as readonly string[]).includes(rawSalary) ? rawSalary : "",
  };

  const countries = useMemo(
    () =>
      countryFacets(openings)
        .map((f) => ({ ...f, name: countryName(f.code, locale) }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [openings, locale]
  );
  const departments = useMemo(() => departmentFacets(openings), [openings]);
  const cities = useMemo(() => cityFacets(openings, current.country || undefined), [openings, current.country]);
  const types = useMemo(() => employmentTypeFacets(openings), [openings]);
  const seniorities = useMemo(() => seniorityFacets(openings), [openings]);
  const salaries = useMemo(() => salaryRangeFacets(openings), [openings]);
  const results = filterPublicOpenings(openings, {
    ...current,
    seniority: (current.seniority || undefined) as Seniority | undefined,
    salaryRange: (current.salary || undefined) as SalaryRangeId | undefined,
  });

  function update(patch: Partial<Record<Key, string>>) {
    const next = new URLSearchParams(params.toString());
    next.delete("type");
    next.delete("workModel");
    if (patch.country !== undefined) next.delete("city");
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const chips: { key: Key; label: string }[] = [];
  if (current.q) chips.push({ key: "q", label: `"${current.q}"` });
  if (current.country) chips.push({ key: "country", label: countryName(current.country, locale) });
  if (current.city) chips.push({ key: "city", label: current.city });
  if (current.department) chips.push({ key: "department", label: current.department });
  if (current.employmentType) chips.push({ key: "employmentType", label: tl(`employmentType.${current.employmentType}` as never) });
  if (current.seniority) chips.push({ key: "seniority", label: tl(`seniority.${current.seniority}` as never) });
  if (current.salary) chips.push({ key: "salary", label: t(`salary.${current.salary}` as never) });

  const countryLabel = current.country ? countryName(current.country, locale) : "";

  return (
    <div>
      <form
        key={current.q}
        role="search"
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
        }}
      >
        <div className="relative flex-1">
          <label htmlFor="openings-q" className="sr-only">
            {t("searchLabel")}
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-oboya-blue-dark/50" aria-hidden />
          <input
            id="openings-q"
            name="q"
            type="search"
            defaultValue={current.q}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            className={cn(selectClass, "pl-9")}
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-full bg-oboya-blue-dark px-8 text-sm font-semibold tracking-wider text-white uppercase transition-colors hover:bg-oboya-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue"
        >
          {t("searchSubmit")}
        </button>
      </form>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <FilterSelect
          id="openings-country"
          label={t("filters.country")}
          value={current.country}
          anyLabel={t("filters.allCountries")}
          options={[
            ...countries.map((c) => ({ value: c.code, label: c.name })),
            ...(current.country && !countries.some((c) => c.code === current.country)
              ? [{ value: current.country, label: countryLabel }]
              : []),
          ]}
          onChange={(v) => update({ country: v })}
        />
        <FilterSelect
          id="openings-city"
          label={t("filters.city")}
          value={current.city}
          anyLabel={t("filters.allCities")}
          options={[
            ...cities.map((c) => ({ value: c.name, label: c.name })),
            ...(current.city && !cities.some((c) => c.name === current.city)
              ? [{ value: current.city, label: current.city }]
              : []),
          ]}
          onChange={(v) => update({ city: v })}
        />
        <FilterSelect
          id="openings-department"
          label={t("filters.department")}
          value={current.department}
          anyLabel={t("filters.allDepartments")}
          options={departments.map((d) => ({ value: d.name, label: d.name }))}
          onChange={(v) => update({ department: v })}
        />
        <FilterSelect
          id="openings-type"
          label={t("filters.employmentType")}
          value={current.employmentType}
          anyLabel={t("filters.any")}
          options={types.map((f) => ({ value: f.value, label: tl(`employmentType.${f.value}`) }))}
          onChange={(v) => update({ employmentType: v })}
        />
        <FilterSelect
          id="openings-seniority"
          label={t("filters.seniority")}
          value={current.seniority}
          anyLabel={t("filters.any")}
          options={seniorities.map((f) => ({ value: f.value, label: tl(`seniority.${f.value}`) }))}
          onChange={(v) => update({ seniority: v })}
        />
        <FilterSelect
          id="openings-salary"
          label={t("filters.salaryRange")}
          value={current.salary}
          anyLabel={t("filters.any")}
          options={salaries.map((f) => ({ value: f.id, label: t(`salary.${f.id}`) }))}
          onChange={(v) => update({ salary: v })}
        />
      </div>

      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={t("activeFilters")}>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => update({ [c.key]: "" })}
              aria-label={t("removeFilter", { label: c.label })}
              className="inline-flex items-center gap-1.5 rounded-full bg-oboya-blue-dark px-3 py-1 text-xs font-medium text-white hover:bg-oboya-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue"
            >
              {c.label}
              <X className="size-3" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="text-xs font-medium text-oboya-blue underline-offset-2 hover:underline"
          >
            {t("clearFilters")}
          </button>
        </div>
      ) : null}

      <p className="mt-8 mb-4 text-sm font-semibold text-oboya-blue-dark/70" aria-live="polite">
        {t("resultCount", { count: results.length })}
      </p>

      {results.length > 0 ? (
        <OpeningsList openings={results} />
      ) : (
        <div className="rounded-sm border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold text-oboya-blue-dark">
            {countryLabel ? t("empty.countryTitle", { country: countryLabel }) : t("empty.title")}
          </p>
          <p className="mt-2 text-sm text-oboya-blue-dark/70">{t("empty.description")}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {chips.length > 0 ? (
              <button
                type="button"
                onClick={() => router.replace(pathname, { scroll: false })}
                className="min-h-11 rounded-full border border-oboya-blue-dark px-6 text-sm font-semibold tracking-wider text-oboya-blue-dark uppercase hover:bg-oboya-blue-dark hover:text-white"
              >
                {t("empty.clearFilters")}
              </button>
            ) : null}
            <Link
              href="/work/apply"
              className="inline-flex min-h-11 items-center rounded-full bg-oboya-green px-6 text-sm font-semibold tracking-wider text-white uppercase hover:bg-oboya-green/90"
            >
              {t("empty.talentPoolCta")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  anyLabel,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  anyLabel: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-oboya-blue-dark/70">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">{anyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
