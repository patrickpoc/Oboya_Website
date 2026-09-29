"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ErrorState, TableSkeleton } from "@/components/admin/common/states";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  /** Value used for sorting when the column key isn't a plain field */
  sortValue?: (row: T) => string | number;
  className?: string;
  /** Label for mobile card layout (defaults to header) */
  mobileLabel?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchKey?: keyof T & string;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  getRowId?: (row: T) => string;
  emptyMessage?: string;
  /** Rich empty state; overrides emptyMessage */
  emptyState?: React.ReactNode;
  /** Stacked cards on viewports below md */
  mobileLayout?: "table" | "cards";
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Keep the header visible while scrolling long tables */
  stickyHeader?: boolean;
  /** Rendered in a bar above the table while rows are selected */
  bulkActions?: (selectedIds: string[]) => React.ReactNode;
  rowClassName?: (row: T) => string | undefined;
  /** Extra controls rendered next to the built-in search */
  toolbar?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  searchKey,
  searchPlaceholder,
  pageSize = 10,
  onRowClick,
  selectedIds = [],
  onSelectionChange,
  getRowId,
  emptyMessage,
  emptyState,
  mobileLayout = "cards",
  loading,
  error,
  onRetry,
  stickyHeader,
  bulkActions,
  rowClassName,
  toolbar,
}: DataTableProps<T>) {
  const t = useTranslations("admin.common");
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("search");
  const resolvedEmptyMessage = emptyMessage ?? t("noRecords");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search && searchKey) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        String((row as Record<string, unknown>)[searchKey] ?? "")
          .toLowerCase()
          .includes(q)
      );
    }
    if (sortKey) {
      const column = columns.find((c) => c.key === sortKey);
      const read = (row: T) =>
        column?.sortValue ? column.sortValue(row) : String((row as Record<string, unknown>)[sortKey] ?? "");
      rows.sort((a, b) => {
        const av = read(a);
        const bv = read(b);
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, columns, search, searchKey, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const selectable = Boolean(onSelectionChange && getRowId);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  const toggleAll = () => {
    if (!onSelectionChange || !getRowId) return;
    const pageIds = paged.map(getRowId);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    onSelectionChange(
      allSelected
        ? selectedIds.filter((id) => !pageIds.includes(id))
        : [...new Set([...selectedIds, ...pageIds])]
    );
  };

  const from = filtered.length === 0 ? 0 : currentPage * pageSize + 1;
  const to = Math.min(filtered.length, (currentPage + 1) * pageSize);
  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{t("showing", { from, to, total: filtered.length })}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border p-2 disabled:opacity-40 md:min-h-8 md:min-w-8"
          aria-label={t("previousPage")}
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <span>
          {currentPage + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages - 1}
          onClick={() => setPage(currentPage + 1)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border p-2 disabled:opacity-40 md:min-h-8 md:min-w-8"
          aria-label={t("nextPage")}
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );

  const toolbarRow = (searchKey || toolbar) && (
    <div className="flex flex-wrap items-center gap-2">
      {searchKey && (
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={resolvedSearchPlaceholder}
            className="h-11 pl-8 text-base md:h-8 md:text-sm"
          />
        </div>
      )}
      {toolbar}
    </div>
  );

  const bulkBar = bulkActions && selectedIds.length > 0 && (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-oboya-blue/20 bg-oboya-blue/5 px-3 py-2">
      <span className="text-xs font-semibold text-oboya-blue-dark">
        {t("selectedCount", { count: selectedIds.length })}
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-2">{bulkActions(selectedIds)}</div>
      <button
        type="button"
        onClick={() => onSelectionChange?.([])}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-oboya-blue-dark"
      >
        <X className="size-3" />
        {t("clearSelection")}
      </button>
    </div>
  );

  if (error) {
    return (
      <div className="space-y-3">
        {toolbarRow}
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {toolbarRow}
        <TableSkeleton columns={Math.min(columns.length, 6)} />
      </div>
    );
  }

  const emptyContent = emptyState ?? (
    <p className="py-8 text-center text-muted-foreground">{resolvedEmptyMessage}</p>
  );

  return (
    <div className="space-y-3">
      {toolbarRow}
      {bulkBar}

      {mobileLayout === "cards" && (
        <div className="space-y-3 md:hidden">
          {paged.length === 0 ? (
            emptyState ?? (
              <p className="rounded-xl border border-border/60 bg-white py-8 text-center text-muted-foreground">
                {resolvedEmptyMessage}
              </p>
            )
          ) : (
            paged.map((row, i) => {
              const rowId = getRowId?.(row);
              return (
                <article
                  key={rowId ?? i}
                  className={cn(
                    "rounded-xl border border-border/60 bg-white p-4 shadow-sm",
                    onRowClick && "cursor-pointer active:bg-muted/30",
                    rowClassName?.(row)
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {onSelectionChange && rowId && (
                    <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(rowId)}
                        onChange={() => toggleRow(rowId)}
                      />
                    </div>
                  )}
                  <dl className="space-y-2">
                    {columns.map((col) => (
                      <div key={col.key} className="flex flex-col gap-0.5">
                        <dt className="text-xs font-medium text-muted-foreground">
                          {col.mobileLabel ?? col.header}
                        </dt>
                        <dd className="text-sm text-oboya-blue-dark">
                          {col.cell(row)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              );
            })
          )}
          {pagination}
        </div>
      )}

      <div
        className={cn(
          "rounded-xl border border-border/60 bg-white -mx-4 px-4 sm:mx-0 sm:px-0",
          stickyHeader ? "max-h-[70vh] overflow-auto" : "overflow-x-auto",
          mobileLayout === "cards" && "hidden md:block"
        )}
      >
        <Table>
          <TableHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-white shadow-[0_1px_0_var(--border)]")}>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label={t("selectAll")}
                    checked={
                      paged.length > 0 &&
                      paged.every((r) => selectedIds.includes(getRowId!(r)))
                    }
                    onChange={toggleAll}
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  aria-sort={
                    sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={cn(
                    col.sortable && "cursor-pointer touch-manipulation select-none hover:text-oboya-blue-dark",
                    col.className
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key &&
                      (sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="p-4">
                  {emptyContent}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row, i) => {
                const rowId = getRowId?.(row);
                return (
                  <TableRow
                    key={rowId ?? i}
                    data-state={rowId && selectedIds.includes(rowId) ? "selected" : undefined}
                    className={cn(onRowClick && "cursor-pointer", rowClassName?.(row))}
                    onClick={() => onRowClick?.(row)}
                  >
                    {onSelectionChange && rowId && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(rowId)}
                          onChange={() => toggleRow(rowId)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {mobileLayout !== "cards" && pagination}
      {mobileLayout === "cards" && (
        <div className="hidden md:block">{pagination}</div>
      )}
    </div>
  );
}
