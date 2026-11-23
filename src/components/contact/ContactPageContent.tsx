"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  CharCount,
  CountrySelect,
  OTHER_COUNTRY_CODE,
  PhoneCountrySelect,
  underlineField,
} from "@/components/contact/ContactFieldControls";
import { ContactIntroStep } from "@/components/contact/ContactIntroStep";
import { ContactTeam } from "@/components/contact/ContactTeam";
import type { ContactPerson } from "@/lib/cms/repositories/contact-team-repository";
import { ContactThankYouDialog } from "@/components/contact/ContactThankYouDialog";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/constants/site";
import { Link } from "@/i18n/navigation";
import { getWorldCountryByCode } from "@/lib/contact/world-countries";
import { cn } from "@/lib/utils";
import { collectLeadContext } from "@/lib/forms/lead-context";

const SUBJECT_MAX = 50;
const MESSAGE_MAX = 500;
const COMPANY_MAX = 120;

function isFormDeepLink() {
  const { search, hash } = window.location;
  return new URLSearchParams(search).get("step") === "form" || hash === "#form";
}

export function ContactPageContent({ team = [] }: { team?: ContactPerson[] }) {
  const t = useTranslations("contact");
  const tPages = useTranslations("pages.contact");

  const [step, setStep] = useState<"intro" | "form">("intro");
  const [thanksOpen, setThanksOpen] = useState(false);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusFormRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const sentRef = useRef<HTMLDivElement>(null);
  // The sent state is much shorter than the form: bring it into view after a successful submit.
  useEffect(() => {
    if (!submitted) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sentRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [submitted]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const dialCode = useMemo(() => {
    return getWorldCountryByCode(phoneCountryCode)?.dial ?? "+1";
  }, [phoneCountryCode]);

  useEffect(() => {
    const sync = () => setStep(isFormDeepLink() ? "form" : "intro");
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    if (step === "form" && focusFormRef.current) {
      focusFormRef.current = false;
      window.scrollTo({ top: 0 });
      formHeadingRef.current?.focus({ preventScroll: true });
    }
  }, [step]);

  const resetForm = useCallback(() => {
    setSubmitted(false);
    setError(null);
    setSubject("");
    setMessage("");
    setPhoneLocal("");
    setPrivacyAccepted(false);
    setMarketingOptIn(false);
  }, []);

  const startRequest = useCallback(() => {
    focusFormRef.current = true;
    window.history.pushState(null, "", "?step=form");
    setStep("form");
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!countryCode) {
      setError(t("countryPlaceholder"));
      return;
    }

    if (!privacyAccepted) {
      setError(t("privacyAccept"));
      return;
    }

    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const country =
      countryCode === OTHER_COUNTRY_CODE
        ? { code: OTHER_COUNTRY_CODE, name: t("countryOther") }
        : getWorldCountryByCode(countryCode);

    const local = phoneLocal.trim().replace(/^0+/, "");
    const phone = local ? `${dialCode} ${local}` : "";

    const payload = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone,
      countryCode: country?.code ?? countryCode,
      countryName: country?.name ?? countryCode,
      company: String(formData.get("company") ?? "").trim(),
      subject: subject.trim(),
      message: message.trim(),
      privacyAccepted,
      marketingOptIn,
      context: collectLeadContext(),
    };

    try {
      const res = await fetch("/api/cms/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", ...payload }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? t("error"));
      }

      setSubmitted(true);
      setThanksOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "intro") {
    return (
      <div className="bg-white">
        <ContactIntroStep onStart={startRequest} />
        <ContactTeam team={team} />
      </div>
    );
  }

  return (
    <div className="bg-oboya-soft-white">
      <section className="bg-oboya-blue-dark pb-36 pt-16 md:pb-44 md:pt-20">
        <Container className="text-center">
          <p className="text-sm font-medium tracking-wide text-white/80">
            {tPages("title")}
          </p>
          <h1 ref={formHeadingRef} tabIndex={-1} className="mx-auto mt-6 outline-none max-w-3xl font-display text-[length:var(--text-heading)] leading-[var(--text-heading-leading)] text-white">
            {tPages("description")}
          </h1>
        </Container>
      </section>

      <section className="relative -mt-20 pb-20 md:-mt-36 md:pb-28">
        <Container size="wide">
          <div className="grid overflow-hidden rounded-sm bg-white shadow-[var(--shadow-card)] md:grid-cols-[minmax(240px,0.38fr)_1fr]">
            <aside className="flex flex-col gap-8 bg-oboya-soft-white px-4 py-8 sm:px-8 md:px-10 md:py-12">
              <h2 className="font-display text-xl font-semibold text-oboya-blue-dark md:text-2xl">
                {t("sidebarTitle")}
              </h2>

              <div className="flex items-center gap-4">
                <a
                  href={siteConfig.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-oboya-green transition-opacity hover:opacity-80"
                  aria-label={t("linkedin")}
                >
                  <LinkedInIcon className="size-5" />
                </a>
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-oboya-green transition-opacity hover:opacity-80"
                  aria-label={t("instagram")}
                >
                  <InstagramIcon className="size-5" />
                </a>
              </div>
            </aside>

            <div className="px-8 py-10 md:px-12 md:py-12">
              {submitted ? (
                <div
                  ref={sentRef}
                  role="status"
                  className="flex scroll-mt-28 flex-col overflow-hidden rounded-sm border border-oboya-blue-dark/10 bg-white"
                >
                  <div className="relative h-36 sm:h-44">
                    <Image
                      src="/assets/homepage/wheel-growing.jpg"
                      alt=""
                      fill
                      sizes="(min-width: 768px) 60vw, 100vw"
                      className="object-cover object-[50%_35%]"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-oboya-blue-dark/70 to-oboya-blue-dark/10"
                    />
                    <span
                      aria-hidden
                      className="absolute bottom-5 left-6 flex size-10 items-center justify-center rounded-full bg-oboya-green text-white sm:left-10"
                    >
                      <Check className="size-5" strokeWidth={2.5} />
                    </span>
                  </div>
                  <div className="flex flex-col gap-5 px-6 py-8 text-oboya-blue-dark sm:px-10 sm:py-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-oboya-green">
                      {t("sent.eyebrow")}
                    </p>
                    <h3 className="font-display text-[length:clamp(1.5rem,2.4vw,1.875rem)] font-light leading-[1.2]">
                      {t("sent.title")}
                    </h3>
                    <span aria-hidden className="h-0.5 w-12 bg-oboya-orange" />
                    <p className="max-w-prose text-base leading-relaxed text-oboya-blue-dark/80">
                      {t("success")}
                    </p>
                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-oboya-blue-dark px-6 text-sm font-semibold text-oboya-blue-dark transition-colors hover:bg-oboya-blue-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue-light"
                      >
                        {t("sent.again")}
                      </button>
                      <Link
                        href="/"
                        className="group inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-oboya-blue-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oboya-blue-light"
                      >
                        <span className="flex size-8 items-center justify-center rounded-full border border-oboya-orange transition-colors group-hover:bg-oboya-orange group-hover:text-white">
                          <ChevronRight className="size-4" aria-hidden />
                        </span>
                        {t("sent.home")}
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="firstName"
                        className="text-sm font-semibold text-oboya-blue-dark"
                      >
                        {t("field1")}
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        autoComplete="given-name"
                        placeholder={t("field1Placeholder")}
                        className={underlineField}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="lastName"
                        className="text-sm font-semibold text-oboya-blue-dark"
                      >
                        {t("field2")}
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        autoComplete="family-name"
                        placeholder={t("field2Placeholder")}
                        className={underlineField}
                      />
                    </div>
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-semibold text-oboya-blue-dark"
                      >
                        {t("email")}
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={t("emailPlaceholder")}
                        className={underlineField}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="phone"
                        className="text-sm font-semibold text-oboya-blue-dark"
                      >
                        {t("phone")}
                      </label>
                      <div className="flex items-end gap-3">
                        <PhoneCountrySelect
                          value={phoneCountryCode}
                          onChange={setPhoneCountryCode}
                          label={t("phoneCountry")}
                          searchPlaceholder={t("phoneCountrySearch")}
                          emptyLabel={t("phoneCountryEmpty")}
                        />
                        <input
                          id="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          value={phoneLocal}
                          onChange={(event) => setPhoneLocal(event.target.value)}
                          placeholder={t("phoneLocalPlaceholder")}
                          className={underlineField}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="company"
                        className="text-sm font-semibold text-oboya-blue-dark"
                      >
                        {t("company")}
                      </label>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        maxLength={COMPANY_MAX}
                        autoComplete="organization"
                        placeholder={t("companyPlaceholder")}
                        className={underlineField}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="countryCode"
                        className="text-sm font-semibold text-oboya-blue-dark"
                      >
                        {t("country")}
                      </label>
                      <CountrySelect
                        value={countryCode}
                        onChange={setCountryCode}
                        label={t("country")}
                        placeholder={t("countryPlaceholder")}
                        otherLabel={t("countryOther")}
                        searchPlaceholder={t("countrySearch")}
                        emptyLabel={t("countryEmpty")}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="subject"
                      className="text-sm font-semibold text-oboya-blue-dark"
                    >
                      {t("subject")}
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      maxLength={SUBJECT_MAX}
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder={t("subjectPlaceholder")}
                      className={underlineField}
                    />
                    <CharCount remaining={SUBJECT_MAX - subject.length} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="message"
                      className="text-sm font-semibold text-oboya-blue-dark"
                    >
                      {t("message")}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      maxLength={MESSAGE_MAX}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={t("messagePlaceholder")}
                      className={cn(underlineField, "resize-none")}
                    />
                    <CharCount remaining={MESSAGE_MAX - message.length} />
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="text-xs leading-relaxed text-oboya-blue-dark/70">
                      {t.rich("privacyNotice", {
                        link: (chunks) => (
                          <Link
                            href="/privacy"
                            className="text-oboya-blue-light underline-offset-2 hover:underline"
                          >
                            {chunks}
                          </Link>
                        ),
                      })}
                    </p>
                    <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
                      <input
                        type="checkbox"
                        required
                        checked={privacyAccepted}
                        onChange={(event) => setPrivacyAccepted(event.target.checked)}
                        className="mt-0.5 size-4 accent-oboya-blue-dark"
                      />
                      <span>{t("privacyAccept")}</span>
                    </label>
                    <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
                      <input
                        type="checkbox"
                        checked={marketingOptIn}
                        onChange={(event) => setMarketingOptIn(event.target.checked)}
                        className="mt-0.5 size-4 accent-oboya-blue-dark"
                      />
                      <span>{t("marketingOptIn")}</span>
                    </label>
                  </div>

                  {error && (
                    <p className="text-sm text-oboya-orange" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-11 w-full rounded-full border border-oboya-blue-dark px-8 py-2.5 text-sm font-semibold tracking-wider text-oboya-blue-dark uppercase transition-colors hover:bg-oboya-blue-dark hover:text-white disabled:opacity-60 sm:w-auto"
                    >
                      {submitting ? t("submitting") : t("submit")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Container>
      </section>
      <ContactThankYouDialog open={thanksOpen} onOpenChange={setThanksOpen} />
    </div>
  );
}

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.06-2.065 2.064 2.064 0 112.06 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
