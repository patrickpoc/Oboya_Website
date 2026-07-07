"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";

export function ContactForm() {
  const t = useTranslations("contact");
  const tCommon = useTranslations("common");

  return (
    <section className="py-16 md:py-20">
      <Container size="narrow">
        <p className="mb-10 text-[var(--text-body)] leading-[var(--text-body-leading)] text-muted-foreground">
          {tCommon("loremShort")}
        </p>
        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="first-name" className="text-sm font-medium text-oboya-blue-dark">
                {t("field1")}
              </label>
              <input
                id="first-name"
                type="text"
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
                placeholder={t("field2Placeholder")}
                className="h-11 rounded-lg border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-oboya-green focus:ring-2 focus:ring-oboya-green/20"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-oboya-blue-dark">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
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
          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-sm font-medium text-oboya-blue-dark">
              {t("message")}
            </label>
            <textarea
              id="message"
              rows={5}
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
