"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  instructionKey,
  type SpreadsheetColumnRequirement,
} from "@/lib/cms/spreadsheet-instructions";

type Props = {
  /** Next-intl namespace that holds `instructions.*` (e.g. admin.products.bulkImport). */
  namespace: "admin.products.bulkImport" | "admin.products.bulk";
  headers: readonly string[];
  requirements: Record<string, SpreadsheetColumnRequirement>;
  /** Product limit per file, interpolated into the rules. */
  max: number;
};

export function SpreadsheetInstructions({ namespace, headers, requirements, max }: Props) {
  const t = useTranslations(namespace);

  return (
    <Accordion className="mt-3 rounded-lg border border-border/60 bg-oboya-soft-white px-3">
      <AccordionItem value="instructions" className="border-0">
        <AccordionTrigger className="text-oboya-blue-dark">
          {t("instructions.title")}
        </AccordionTrigger>
        <AccordionContent className="[&_p:not(:last-child)]:mb-0">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{t("instructions.intro")}</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {(["rule1", "rule2", "rule3", "rule4"] as const).map((rule) => (
                <li key={rule}>{t(`instructions.${rule}`, { max })}</li>
              ))}
            </ul>
            <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {headers.map((header) => {
                const key = instructionKey(header);
                const requirement = requirements[header] ?? "optional";
                return (
                  <li
                    key={header}
                    className="rounded-lg border border-border/60 bg-white p-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-oboya-soft-white px-1.5 py-0.5 font-mono text-oboya-blue-dark">
                        {header}
                      </code>
                      <Badge
                        variant={requirement === "optional" ? "outline" : "default"}
                        className={requirement === "optional" ? undefined : "bg-oboya-blue text-white"}
                      >
                        {t(`instructions.requirement.${requirement}`)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-foreground">{t(`instructions.columns.${key}.meaning`)}</p>
                    <p className="mt-1 break-words text-muted-foreground">
                      {t("instructions.exampleLabel")}{" "}
                      <code className="font-mono text-oboya-blue-dark">
                        {t(`instructions.columns.${key}.example`)}
                      </code>
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
