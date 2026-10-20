"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CountrySelect,
  OTHER_COUNTRY_CODE,
} from "@/components/contact/ContactFieldControls";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getWorldCountryByCode } from "@/lib/contact/world-countries";
import { collectLeadContext } from "@/lib/forms/lead-context";

const benefits = ["b1", "b2", "b3", "b4"] as const;
const openings = ["o1", "o2", "o3"] as const;
const APPLICATION_SUBJECT = "Work with us";
const MESSAGE_MAX = 500;

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "-";
  return { firstName, lastName };
}

export function WorkWithUsPageContent() {
  const t = useTranslations("workWithUsPage");
  const tContact = useTranslations("contact");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!countryCode) {
      setError(tContact("countryPlaceholder"));
      return;
    }
    if (!privacyAccepted) {
      setError(tContact("privacyAccept"));
      return;
    }

    const { firstName, lastName } = splitName(name);
    if (!firstName) {
      setError(tContact("error"));
      return;
    }

    const country =
      countryCode === OTHER_COUNTRY_CODE
        ? { code: OTHER_COUNTRY_CODE, name: tContact("countryOther") }
        : getWorldCountryByCode(countryCode);

    setSubmitting(true);
    try {
      const res = await fetch("/api/cms/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          firstName,
          lastName,
          email: email.trim(),
          phone: "",
          countryCode: country?.code ?? countryCode,
          countryName: country?.name ?? countryCode,
          subject: APPLICATION_SUBJECT,
          message: message.trim(),
          privacyAccepted,
          marketingOptIn,
          context: collectLeadContext(),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? tContact("error"));
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : tContact("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="py-16 md:py-20">
        <Container>
          <p className="max-w-2xl text-muted-foreground">{t("intro")}</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-xl border border-border/60 bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-oboya-blue-dark">
                  {t(`benefits.${benefit}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`benefits.${benefit}.description`)}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-oboya-soft-white py-16 md:py-20">
        <Container>
          <h2 className="font-display text-2xl font-semibold text-oboya-blue-dark">
            {t("openings.title")}
          </h2>
          <div className="mt-8 grid gap-4">
            {openings.map((opening) => (
              <article
                key={opening}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-oboya-blue-dark">
                    {t(`openings.${opening}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`openings.${opening}.location`)}
                  </p>
                </div>
                <span className="text-sm font-medium text-oboya-green">
                  {t(`openings.${opening}.type`)}
                </span>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-20">
        <Container size="narrow">
          <h2 className="font-display text-2xl font-semibold text-oboya-blue-dark">
            {t("application.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("application.description")}</p>
          {submitted ? (
            <p className="mt-8 rounded-xl border border-oboya-green/30 bg-oboya-green/5 px-5 py-4 text-sm text-oboya-blue-dark">
              {t("application.success")}
            </p>
          ) : (
            <form className="mt-8 flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
              <input
                required
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("application.name")}
                className="h-11 rounded-lg border border-border px-4 text-sm"
              />
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("application.email")}
                className="h-11 rounded-lg border border-border px-4 text-sm"
              />
              <CountrySelect
                value={countryCode}
                required
                onChange={setCountryCode}
                label={tContact("country")}
                placeholder={tContact("countryPlaceholder")}
                otherLabel={tContact("countryOther")}
                searchPlaceholder={tContact("countrySearch")}
                emptyLabel={tContact("countryEmpty")}
              />
              <textarea
                required
                name="message"
                rows={4}
                maxLength={MESSAGE_MAX}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("application.message")}
                className="rounded-lg border border-border px-4 py-3 text-sm"
              />
              <div className="flex flex-col gap-3">
                <p className="text-xs leading-relaxed text-oboya-blue-dark/70">
                  {tContact("privacyNotice")}{" "}
                  <Link
                    href="/privacy"
                    className="text-oboya-blue-light underline-offset-2 hover:underline"
                  >
                    {tContact("privacyLink")}
                  </Link>
                </p>
                <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
                  <input
                    type="checkbox"
                    required
                    checked={privacyAccepted}
                    onChange={(event) => setPrivacyAccepted(event.target.checked)}
                    className="mt-0.5 size-4 accent-oboya-blue-dark"
                  />
                  <span>{tContact("privacyAccept")}</span>
                </label>
                <label className="flex items-start gap-2 text-xs text-oboya-blue-dark/80">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(event) => setMarketingOptIn(event.target.checked)}
                    className="mt-0.5 size-4 accent-oboya-blue-dark"
                  />
                  <span>{tContact("marketingOptIn")}</span>
                </label>
              </div>
              {error ? (
                <p className="text-sm text-oboya-orange" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className={buttonVariants({
                  size: "cta",
                  className: "bg-oboya-green text-white hover:bg-oboya-green/90",
                })}
              >
                {submitting ? tContact("submitting") : t("application.submit")}
              </button>
            </form>
          )}
        </Container>
      </section>
    </>
  );
}
