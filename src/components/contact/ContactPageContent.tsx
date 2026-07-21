"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/constants/site";
import { getShopCatalog, getCountryByCode } from "@/lib/shop/catalog";
import { cn } from "@/lib/utils";

const SUBJECTS = ["general", "products", "partnership", "support"] as const;

const underlineField =
  "w-full border-0 border-b border-oboya-blue-dark/20 bg-transparent px-0 py-2 text-sm text-oboya-blue-dark outline-none transition-colors placeholder:text-oboya-blue-dark/35 focus:border-oboya-blue-dark";

export function ContactPageContent() {
  const t = useTranslations("contact");
  const tPages = useTranslations("pages.contact");
  const countries = useMemo(() => getShopCatalog().countries, []);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("general");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const countryCode = String(formData.get("countryCode") ?? "");
    const country =
      countryCode === "OTHER"
        ? { code: "OTHER", name: t("countryOther") }
        : getCountryByCode(countryCode);

    const payload = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      countryCode: country?.code ?? countryCode,
      countryName: country?.name ?? countryCode,
      subject,
      message: String(formData.get("message") ?? "").trim(),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-oboya-soft-white">
      <section className="bg-oboya-blue-dark pb-36 pt-16 md:pb-44 md:pt-20">
        <Container className="text-center">
          <p className="text-sm font-medium tracking-wide text-white/80">
            {tPages("title")}
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-[length:var(--text-heading)] leading-[var(--text-heading-leading)] text-white">
            {tPages("description")}
          </h1>
        </Container>
      </section>

      <section className="relative -mt-28 pb-20 md:-mt-36 md:pb-28">
        <Container size="wide">
          <div className="grid overflow-hidden rounded-sm bg-white shadow-[var(--shadow-card)] md:grid-cols-[minmax(240px,0.38fr)_1fr]">
            <aside className="flex flex-col gap-8 bg-oboya-soft-white px-8 py-10 md:px-10 md:py-12">
              <h2 className="font-display text-xl font-semibold text-oboya-blue-dark md:text-2xl">
                {t("sidebarTitle")}
              </h2>

              <ul className="flex flex-col gap-5 text-sm text-oboya-blue-dark">
                <li className="flex items-start gap-3">
                  <Phone
                    className="mt-0.5 size-4 shrink-0 text-oboya-green"
                    aria-hidden
                  />
                  <a
                    href={`tel:${siteConfig.company.phone.replace(/\s/g, "")}`}
                    className="hover:text-oboya-green"
                  >
                    {siteConfig.company.phone}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Mail
                    className="mt-0.5 size-4 shrink-0 text-oboya-green"
                    aria-hidden
                  />
                  <a
                    href={`mailto:${siteConfig.company.email}`}
                    className="hover:text-oboya-green"
                  >
                    {siteConfig.company.email}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-oboya-green"
                    aria-hidden
                  />
                  <span>{t("location")}</span>
                </li>
              </ul>

              <div className="mt-auto flex items-center gap-4 pt-4">
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
                <p className="rounded-xl border border-oboya-green/30 bg-oboya-green/5 px-5 py-4 text-sm text-oboya-blue-dark">
                  {t("success")}
                </p>
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
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder={t("phonePlaceholder")}
                        className={underlineField}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="countryCode"
                      className="text-sm font-semibold text-oboya-blue-dark"
                    >
                      {t("country")}
                    </label>
                    <select
                      id="countryCode"
                      name="countryCode"
                      required
                      defaultValue=""
                      className={cn(underlineField, "cursor-pointer appearance-none")}
                    >
                      <option value="" disabled>
                        {t("countryPlaceholder")}
                      </option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                      <option value="OTHER">{t("countryOther")}</option>
                    </select>
                  </div>

                  <fieldset className="flex flex-col gap-4">
                    <legend className="text-sm font-semibold text-oboya-blue-dark">
                      {t("subject")}
                    </legend>
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      {SUBJECTS.map((key) => {
                        const selected = subject === key;
                        return (
                          <label
                            key={key}
                            className="flex cursor-pointer items-center gap-2 text-sm text-oboya-blue-dark"
                          >
                            <input
                              type="radio"
                              name="subject"
                              value={key}
                              checked={selected}
                              onChange={() => setSubject(key)}
                              className="sr-only"
                            />
                            <span
                              className={cn(
                                "flex size-4 items-center justify-center rounded-full border",
                                selected
                                  ? "border-oboya-blue-dark bg-oboya-blue-dark text-white"
                                  : "border-oboya-blue-dark/40 bg-white"
                              )}
                              aria-hidden
                            >
                              {selected && <Check className="size-2.5" strokeWidth={3} />}
                            </span>
                            {t(`subjects.${key}`)}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

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
                      rows={2}
                      required
                      placeholder={t("messagePlaceholder")}
                      className={cn(underlineField, "resize-none")}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-oboya-orange" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full border border-oboya-blue-dark px-8 py-2.5 text-xs font-semibold tracking-wider text-oboya-blue-dark uppercase transition-colors hover:bg-oboya-blue-dark hover:text-white disabled:opacity-60"
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
    </div>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
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

function InstagramIcon({ className }: { className?: string }) {
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
