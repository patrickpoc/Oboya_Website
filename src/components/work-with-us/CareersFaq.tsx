import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";

const ITEMS = ["q1", "q2", "q3", "q4"] as const;

export function CareersFaq() {
  const t = useTranslations("workWithUsPage.faq");
  return (
    <section className="py-16 md:py-24" aria-labelledby="careers-faq">
      <Container size="narrow">
        <h2 id="careers-faq" className="text-center font-display text-2xl font-semibold text-oboya-blue-dark md:text-3xl">
          {t("title")}
        </h2>
        <Accordion className="mt-8 rounded-sm bg-white px-5">
          {ITEMS.map((q) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="py-4 text-base text-oboya-blue-dark">
                {t(`items.${q}.question`)}
              </AccordionTrigger>
              <AccordionContent className="text-oboya-blue-dark/75">{t(`items.${q}.answer`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}
