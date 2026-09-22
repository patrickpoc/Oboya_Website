"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  BULK_IMPORT_MAX_PRODUCTS,
  type ImportCatalog,
  type ImportWorkspaceRow,
} from "@/lib/cms/bulk-import/types";
import {
  buildImportWorkspaceFromRecords,
  downloadBulkImportTemplate,
  parseImportSpreadsheetFile,
} from "@/lib/cms/bulk-import/parse-spreadsheet";

type Props = {
  catalog: ImportCatalog;
  disabled?: boolean;
  onLoaded: (rows: ImportWorkspaceRow[], truncated: boolean, totalParsed: number) => void;
};

export function SpreadsheetImportPanel({ catalog, disabled, onLoaded }: Props) {
  const t = useTranslations("admin.products.bulkImport");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [info, setInfo] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setErrors([]);
    setInfo(null);
    try {
      const parsed = await parseImportSpreadsheetFile(file);
      if (parsed.errors.length > 0 && parsed.records.length === 0) {
        setErrors(parsed.errors);
        return;
      }
      const { rows, errors: rowErrors, truncated, totalParsed } =
        buildImportWorkspaceFromRecords({
          records: parsed.records,
          catalog,
        });
      const messages = [
        ...parsed.errors,
        ...rowErrors.map(
          (error) => `Row ${error.row}${error.sku ? ` (${error.sku})` : ""}: ${error.message}`
        ),
      ];
      if (truncated) {
        messages.push(
          t("truncatedToMax", { max: BULK_IMPORT_MAX_PRODUCTS, total: totalParsed })
        );
      }
      setErrors(messages);
      setInfo(t("loadedRows", { count: rows.length, total: totalParsed }));
      onLoaded(rows, truncated, totalParsed);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : t("parseFailed")]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-oboya-blue-dark">{t("spreadsheetTitle")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("spreadsheetHint", { max: BULK_IMPORT_MAX_PRODUCTS })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={disabled || busy}
          onClick={() => downloadBulkImportTemplate()}
        >
          <Download className="mr-2 size-4" />
          {t("downloadTemplate")}
        </Button>
        <Button
          type="button"
          className="rounded-full bg-oboya-blue text-white hover:bg-oboya-blue/90"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 size-4" />
          {busy ? t("parsing") : t("uploadSpreadsheet")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
        />
      </div>

      {info && <p className="mt-3 text-sm text-emerald-700">{info}</p>}
      {errors.length > 0 && (
        <div className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
