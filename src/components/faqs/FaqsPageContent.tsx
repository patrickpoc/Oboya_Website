import { readFaqCategories, readFaqs } from "@/lib/cms/readers";
import { FaqsPageView } from "@/components/faqs/FaqsPageView";

interface FaqsPageContentProps {
  locale: string;
}

export async function FaqsPageContent({ locale }: FaqsPageContentProps) {
  const categories = await readFaqCategories();
  const faqs = await readFaqs();

  return (
    <FaqsPageView locale={locale} categories={categories} faqs={faqs} />
  );
}
