"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FaqPlusMinusIcon } from "@/components/faqs/FaqPlusMinusIcon";
import { pickLocalized } from "@/lib/cms/utils";
import type { CmsFaqItem } from "@/lib/cms/repositories/faqs-repository";
import { cn } from "@/lib/utils";

interface FaqTopicAccordionProps {
  items: CmsFaqItem[];
  locale: string;
}

/** Accordion with +/- morph synced to panel open/close. */
export function FaqTopicAccordion({ items, locale }: FaqTopicAccordionProps) {
  return (
    <Accordion multiple className="w-full">
      {items.map((faq) => (
        <AccordionItem
          key={faq.id}
          value={faq.id}
          className="border-0 border-t border-[#A3C9A8]/70 first:border-t not-last:border-b-0 last:border-b last:border-[#A3C9A8]/70"
        >
          <AccordionTrigger
            className={cn(
              "group/faq-trigger gap-5 rounded-none py-6 hover:no-underline sm:py-7",
              "font-body text-[0.9375rem] font-medium tracking-[0.05em] text-oboya-blue-dark uppercase sm:text-base md:text-[1.0625rem]",
              "items-center [&_[data-slot=accordion-trigger-icon]]:hidden"
            )}
          >
            <span className="min-w-0 flex-1 pr-2 text-left leading-snug">
              {pickLocalized(faq.question, locale)}
            </span>
            <FaqPlusMinusIcon />
          </AccordionTrigger>
          <AccordionContent className="pb-6 text-base font-normal leading-relaxed text-oboya-blue-dark/60 normal-case tracking-normal sm:pb-7 sm:text-[1.0625rem] sm:leading-[1.7]">
            {pickLocalized(faq.answer, locale)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
