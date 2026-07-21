import { readFaqCategories, readFaqs } from "@/lib/cms/readers";
import { FaqsPageView } from "@/components/faqs/FaqsPageView";

interface FaqsPageContentProps {
  locale: string;
}

export function FaqsPageContent({ locale }: FaqsPageContentProps) {
  const categories = readFaqCategories();
  const faqs = readFaqs();

  return (
    <FaqsPageView locale={locale} categories={categories} faqs={faqs} />
  );
}
