"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const categories = ["products", "shipping", "quotations", "support"] as const;
const questions = {
  products: ["q1", "q2", "q3"],
  shipping: ["q1", "q2"],
  quotations: ["q1", "q2", "q3"],
  support: ["q1", "q2"],
} as const;

export function FaqsPageContent() {
  const t = useTranslations("faqsPage");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="py-16 md:py-20">
      <Container size="narrow">
        <p className="mb-10 text-muted-foreground">{t("intro")}</p>
        <div className="space-y-10">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-4 text-lg font-semibold text-oboya-blue-dark">
                {t(`categories.${category}`)}
              </h2>
              <div className="space-y-3">
                {questions[category].map((questionKey) => {
                  const id = `${category}-${questionKey}`;
                  const isOpen = openId === id;
                  return (
                    <div
                      key={id}
                      className="overflow-hidden rounded-xl border border-border/60 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : id)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-oboya-blue-dark"
                      >
                        {t(`${category}.${questionKey}.question`)}
                        <span className="text-oboya-green">{isOpen ? "−" : "+"}</span>
                      </button>
                      <div
                        className={cn(
                          "grid transition-all",
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        )}
                      >
                        <div className="overflow-hidden">
                          <p className="border-t border-border/60 px-5 py-4 text-sm text-muted-foreground">
                            {t(`${category}.${questionKey}.answer`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
