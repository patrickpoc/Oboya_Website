"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Can } from "@/components/admin/permissions/Can";
import { createEmptyCmsProduct } from "@/components/admin/marketplace/ProductEditorForm";
import { Button, buttonVariants } from "@/components/ui/button";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { getShopCatalog } from "@/lib/shop/catalog";

function parseCsv(text: string) {
  const rows = text.trim().split(/\r?\n/);
  if (rows.length < 2) return { parsed: [] as Record<string, string>[], errors: ["CSV vazio ou sem linhas de dados."] };
  const headers = rows[0].split(",").map((h) => h.trim());
  const required = ["id", "sku", "name_ptBR", "name_en", "categoryId", "subcategoryId", "brandId"];
  const missing = required.filter((field) => !headers.includes(field));
  if (missing.length > 0) {
    return { parsed: [] as Record<string, string>[], errors: [`Campos obrigatórios ausentes: ${missing.join(", ")}`] };
  }
  const errors: string[] = [];
  const parsed = rows.slice(1).map((line, index) => {
    const values = line.split(",").map((v) => v.trim());
    const entry: Record<string, string> = {};
    headers.forEach((header, i) => {
      entry[header] = values[i] ?? "";
    });
    if (!entry.sku) errors.push(`Linha ${index + 2}: SKU vazio`);
    if (!entry.id) errors.push(`Linha ${index + 2}: ID vazio`);
    return entry;
  });
  return { parsed, errors };
}

export default function ProductBulkImportPage() {
  const catalog = getShopCatalog();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const importedPreview = useMemo(() => rows.slice(0, 100), [rows]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const { parsed, errors: parseErrors } = parseCsv(text);
    setRows(parsed);
    setErrors(parseErrors);
  };

  const commitImport = () => {
    void (async () => {
    if (errors.length > 0) {
      toast.error("Corrija os erros antes de importar.");
      return;
    }
    const category = catalog.categories[0];
    const subcategory = category?.subcategories[0];
    const brand = catalog.brands[0];
    const enabledCountries = Object.fromEntries(
      catalog.countries.map((country) => [country.code, false])
    );

    const imported: CmsProduct[] = rows.map((row) => {
      const base = createEmptyCmsProduct({
        categoryId: row.categoryId || category?.id,
        subcategoryId: row.subcategoryId || subcategory?.id,
        brandId: row.brandId || brand?.id,
      });
      return {
        ...base,
        id: row.id,
        sku: row.sku,
        name: {
          en: row.name_en ?? "",
          "pt-BR": row.name_ptBR ?? "",
          es: row.name_es ?? "",
          "zh-CN": row.name_zhCN ?? "",
        },
        shortDescription: {
          en: row.short_en ?? "",
          "pt-BR": row.short_ptBR ?? "",
          es: row.short_es ?? "",
          "zh-CN": row.short_zhCN ?? "",
        },
        description: {
          en: row.desc_en ?? "",
          "pt-BR": row.desc_ptBR ?? "",
          es: row.desc_es ?? "",
          "zh-CN": row.desc_zhCN ?? "",
        },
        prices: {
          USD: Number(row.price_usd || 0) || 0,
          BRL: Number(row.price_brl || 0) || 0,
          EUR: Number(row.price_eur || 0) || 0,
        },
        stockQuantity: Number(row.stock_quantity || 0) || 0,
        unlimitedStock: row.unlimited_stock === "1",
        enabledCountries,
        availability: { ...enabledCountries },
        images: [row.main_image || "", row.image_2 || "", row.image_3 || ""].filter(Boolean),
      };
    });

    await Promise.all(
      imported.map((product) =>
        fetch("/api/cms/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        })
      )
    );
    toast.success(`${imported.length} produto(s) importado(s).`);
    setRows([]);
    setErrors([]);
    })();
  };

  return (
    <Can module="marketplace" action="view">
      <AdminPageHeader
        title="Bulk Import"
        description="Importe produtos em lote por CSV com pré-validação."
        actions={
          <Link
            href="/admin/marketplace/products"
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            Back to products
          </Link>
        }
      />

      <div className="rounded-xl border border-border/60 bg-white p-4">
        <p className="text-sm font-semibold">Mini tutorial</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Baixe o template CSV.</li>
          <li>Preencha os campos obrigatórios (id, sku, nomes, category/subcategory/brand).</li>
          <li>Faça upload do arquivo para validar os dados.</li>
          <li>Confira a prévia e confirme a importação.</li>
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="data:text/csv;charset=utf-8,id,sku,name_ptBR,name_en,name_es,name_zhCN,categoryId,subcategoryId,brandId,price_usd,price_brl,price_eur,stock_quantity,unlimited_stock,main_image,image_2,image_3,short_ptBR,short_en,desc_ptBR,desc_en%0Aproduto-demo,SKU-001,Produto Demo,Demo Product,Producto Demo,%E6%BC%94%E7%A4%BA%E4%BA%A7%E5%93%81,categoria-demo,subcategoria-demo,brand-demo,100,0,0,10,0,https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800,,,,Texto curto PT,Short text EN,Descri%C3%A7%C3%A3o PT,Description EN"
            download="bulk-products-template.csv"
          >
            <Download className="mr-1 size-4" /> CSV template
          </a>
          <label className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Upload className="mr-1 size-4" /> Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>
          <Button
            size="sm"
            onClick={commitImport}
            disabled={rows.length === 0 || errors.length > 0}
            className="bg-oboya-green text-white hover:bg-oboya-green/90"
          >
            Importar {rows.length} linha(s)
          </Button>
        </div>

        {errors.length > 0 && (
          <ul className="mt-4 list-disc pl-5 text-xs text-destructive">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        {rows.length > 0 && (
          <div className="mt-4 overflow-auto rounded-lg border border-border/60">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  {Object.keys(rows[0]).map((key) => (
                    <th key={key} className="px-2 py-1 text-left">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importedPreview.map((row, index) => (
                  <tr key={`preview-${index}`} className="border-t border-border/40">
                    {Object.keys(rows[0]).map((key) => (
                      <td key={`${index}-${key}`} className="px-2 py-1">
                        {row[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > importedPreview.length && (
              <p className="p-2 text-xs text-muted-foreground">
                Exibindo {importedPreview.length} de {rows.length} linhas.
              </p>
            )}
          </div>
        )}
      </div>
    </Can>
  );
}

