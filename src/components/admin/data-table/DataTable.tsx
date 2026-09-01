"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
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
  /** Stacked cards on viewports below md */
  mobileLayout?: "table" | "cards";
}

export function DataTable<T>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search...",
  pageSize = 10,
  onRowClick,
  selectedIds = [],
  onSelectionChange,
  getRowId,
  emptyMessage = "No records found.",
  mobileLayout = "cards",
}: DataTableProps<T>) {
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
      rows.sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sortKey] ?? "");
        const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [data, search, searchKey, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

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

  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {filtered.length} record{filtered.length !== 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border p-2 disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <span>
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => setPage(page + 1)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border p-2 disabled:opacity-40"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {searchKey && (
        <div className="relative max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="h-11 pl-8 text-base md:h-8 md:text-sm"
          />
        </div>
      )}

      {mobileLayout === "cards" && (
        <div className="space-y-3 md:hidden">
          {paged.length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-white py-8 text-center text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            paged.map((row, i) => {
              const rowId = getRowId?.(row);
              return (
                <article
                  key={rowId ?? i}
                  className={cn(
                    "rounded-xl border border-border/60 bg-white p-4 shadow-sm",
                    onRowClick && "cursor-pointer active:bg-muted/30"
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
          "overflow-x-auto rounded-xl border border-border/60 bg-white -mx-4 px-4 sm:mx-0 sm:px-0",
          mobileLayout === "cards" && "hidden md:block"
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectionChange && getRowId && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={
                      paged.length > 0 &&
                      paged.every((r) => selectedIds.includes(getRowId(r)))
                    }
                    onChange={toggleAll}
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable && "cursor-pointer touch-manipulation select-none",
                    col.className
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  {col.header}
                  {sortKey === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row, i) => {
                const rowId = getRowId?.(row);
                return (
                  <TableRow
                    key={rowId ?? i}
                    className={cn(onRowClick && "cursor-pointer")}
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
