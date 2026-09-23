"use client";

import { useTranslations } from "next-intl";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  downloadBulkUpdateTemplate,
  mergeSpreadsheetIntoWorkspace,
  parseSpreadsheetBuffer,
  type SpreadsheetImportError,
} from "@/lib/cms/bulk-update/spreadsheet";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { BulkUpdateCatalog, BulkWorkspaceRow } from "@/lib/cms/bulk-update/types";
import { useRef, useState } from "react";

type Props = {
  products: CmsProduct[];
  catalog: BulkUpdateCatalog;
  existingRows: BulkWorkspaceRow[];
  onImported: (rows: BulkWorkspaceRow[], errors: SpreadsheetImportError[]) => void;
};

export function SpreadsheetImportPanel({
  products,
  catalog,
  existingRows,
  onImported,
}: Props) {
  const t = useTranslations("admin.products.bulk");
  const inputRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<SpreadsheetImportError[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    setImportErrors([]);
    setParseErrors([]);
    try {
      const buffer = await file.arrayBuffer();
      const { records, errors } = parseSpreadsheetBuffer(buffer, file.name);
      if (errors.length > 0) {
        setParseErrors(errors);
        return;
      }

      const productsBySku = new Map(
        products.map((product) => [product.sku.toLowerCase(), product])
      );
      const result = mergeSpreadsheetIntoWorkspace({
        records,
        productsBySku,
        existingRows,
        catalog,
        products,
      });
      setImportErrors(result.errors);
      onImported(result.rows, result.errors);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-oboya-blue-dark">{t("importSpreadsheet")}</p>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">{t("importSpreadsheetHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => downloadBulkUpdateTemplate()}
          >
            <Download className="mr-2 size-4" />
            {t("downloadTemplate")}
          </Button>
          <Button
            type="button"
            className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 size-4" />
            {busy ? t("importing") : t("uploadCsvXlsx")}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>
      </div>

      {(parseErrors.length > 0 || importErrors.length > 0) && (
        <div className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {parseErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
          {importErrors.map((error) => (
            <p key={`${error.row}-${error.sku}-${error.message}`}>
              {t("rowError", {
                row: error.row,
                sku: error.sku ? t("rowSkuSuffix", { sku: error.sku }) : "",
                message: error.message,
                suggestedAction: error.suggestedAction,
              })}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
