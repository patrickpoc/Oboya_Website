"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";

export function ContactForm() {
  const t = useTranslations("contact");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <section className="py-16 md:py-20">
        <Container size="narrow">
          <p className="rounded-xl border border-oboya-green/30 bg-oboya-green/5 px-5 py-4 text-sm text-oboya-blue-dark">
            {t("success")}
          </p>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20">
      <Container size="narrow">
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="first-name" className="text-sm font-medium text-oboya-blue-dark">
                {t("field1")}
              </label>
              <input
                id="first-name"
                type="text"
                required
                placeholder={t("field1Placeholder")}
                className="h-11 rounded-lg border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-oboya-green focus:ring-2 focus:ring-oboya-green/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="last-name" className="text-sm font-medium text-oboya-blue-dark">
                {t("field2")}
              </label>
              <input
                id="last-name"
                type="text"
                required
                placeholder={t("field2Placeholder")}
                className="h-11 rounded-lg border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-oboya-green focus:ring-2 focus:ring-oboya-green/20"
              />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-oboya-blue-dark">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder={t("emailPlaceholder")}
                className="h-11 rounded-lg border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-oboya-green focus:ring-2 focus:ring-oboya-green/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="company" className="text-sm font-medium text-oboya-blue-dark">
                {t("company")}
              </label>
              <input
                id="company"
                type="text"
                placeholder={t("companyPlaceholder")}
                className="h-11 rounded-lg border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-oboya-green focus:ring-2 focus:ring-oboya-green/20"
              />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="country" className="text-sm font-medium text-oboya-blue-dark">
                {t("country")}
              </label>
              <input
                id="country"
                type="text"
                placeholder={t("countryPlaceholder")}
                className="h-11 rounded-lg border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-oboya-green focus:ring-2 focus:ring-oboya-green/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="subject" className="text-sm font-medium text-oboya-blue-dark">
                {t("subject")}
              </label>
              <input
                id="subject"
                type="text"
                placeholder={t("subjectPlaceholder")}
                className="h-11 rounded-lg border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-oboya-green focus:ring-2 focus:ring-oboya-green/20"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-sm font-medium text-oboya-blue-dark">
              {t("message")}
            </label>
            <textarea
              id="message"
              rows={5}
              required
              placeholder={t("messagePlaceholder")}
              className="resize-none rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-oboya-green focus:ring-2 focus:ring-oboya-green/20"
            />
          </div>
          <button
            type="submit"
            className={buttonVariants({
              className:
                "mt-2 w-fit rounded-full bg-oboya-green px-8 text-white hover:bg-oboya-green/90",
            })}
          >
            {t("submit")}
          </button>
        </form>
      </Container>
    </section>
  );
}
