"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { CatalogueLoadingSpinner } from "@/components/catalogue/CatalogueLoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  CATALOGUE_PDF_PATH,
  CATALOGUE_PDF_WORKER_PATH,
  getCataloguePageWidth,
  getCatalogueThumbnailWidth,
} from "@/constants/catalogue";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = CATALOGUE_PDF_WORKER_PATH;

interface CatalogueViewerProps {
  labels: {
    prev: string;
    next: string;
    navLabel: string;
    pageInputLabel: string;
    loading: string;
    error: string;
  };
}

function ThumbnailButton({
  page,
  isActive,
  thumbnailWidth,
  onSelect,
}: {
  page: number;
  isActive: boolean;
  thumbnailWidth: number;
  onSelect: (page: number) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        data-page={page}
        onClick={() => onSelect(page)}
        className={cn(
          "overflow-hidden rounded-md border bg-white transition-shadow",
          isActive
            ? "border-oboya-green ring-2 ring-oboya-green/40"
            : "border-border/60 hover:border-oboya-green/40"
        )}
        aria-label={`Page ${page}`}
        aria-current={isActive ? "page" : undefined}
      >
        <Page
          pageNumber={page}
          width={thumbnailWidth}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </button>
      <span
        className={cn(
          "text-xs tabular-nums",
          isActive
            ? "font-semibold text-oboya-blue-dark"
            : "text-muted-foreground"
        )}
      >
        {page}
      </span>
    </div>
  );
}

function PageNumberInput({
  pageNumber,
  numPages,
  label,
  onSubmit,
}: {
  pageNumber: number;
  numPages: number;
  label: string;
  onSubmit: (page: number) => void;
}) {
  const [value, setValue] = useState(String(pageNumber));

  useEffect(() => {
    setValue(String(pageNumber));
  }, [pageNumber]);

  const commit = useCallback(() => {
    const parsed = Number.parseInt(value, 10);

    if (
      !Number.isNaN(parsed) &&
      parsed >= 1 &&
      parsed <= numPages &&
      parsed !== pageNumber
    ) {
      onSubmit(parsed);
      return;
    }

    setValue(String(pageNumber));
  }, [numPages, onSubmit, pageNumber, value]);

  if (numPages <= 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-oboya-blue-dark tabular-nums">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(event) =>
          setValue(event.target.value.replace(/\D/g, "").slice(0, 4))
        }
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        disabled={numPages <= 0}
        aria-label={label}
        className="h-8 w-12 rounded-md border border-border bg-background px-2 text-center text-sm outline-none focus-visible:border-oboya-green focus-visible:ring-2 focus-visible:ring-oboya-green/30"
      />
      <span aria-hidden="true">/ {numPages}</span>
    </div>
  );
}

function getInnerContentWidth(element: HTMLElement) {
  const styles = getComputedStyle(element);
  const paddingX =
    parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const borderX =
    parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);

  return Math.max(0, element.clientWidth - paddingX - borderX);
}

export function CatalogueViewer({ labels }: CatalogueViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbContainerRef = useRef<HTMLDivElement>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [isDocumentReady, setIsDocumentReady] = useState(false);

  const thumbnailPages = useMemo(() => {
    if (numPages <= 0) return [];
    return Array.from({ length: numPages }, (_, index) => index + 1);
  }, [numPages]);

  const thumbnailWidth = useMemo(
    () => getCatalogueThumbnailWidth(pageWidth),
    [pageWidth]
  );

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const updateWidth = () => {
      const pdfBox = containerRef.current;
      const measureTarget = pdfBox ?? viewer;
      setPageWidth(getCataloguePageWidth(getInnerContentWidth(measureTarget)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewer);

    const pdfBox = containerRef.current;
    if (pdfBox) observer.observe(pdfBox);

    return () => observer.disconnect();
  }, [isDocumentReady]);

  useEffect(() => {
    if (!isDocumentReady) return;

    const container = thumbContainerRef.current;
    if (!container) return;

    const activeThumb = container.querySelector(
      `[data-page="${pageNumber}"]`
    ) as HTMLElement | null;

    activeThumb?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [pageNumber, isDocumentReady]);

  const goToPrev = useCallback(() => {
    setPageNumber((current) => Math.max(1, current - 1));
  }, []);

  const goToNext = useCallback(() => {
    setPageNumber((current) => Math.min(numPages || current, current + 1));
  }, [numPages]);

  const goToPage = useCallback((page: number) => {
    setPageNumber(page);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  const isFirstPage = pageNumber <= 1;
  const isLastPage = numPages > 0 && pageNumber >= numPages;

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden">
      {loadError ? (
        <div className="flex min-h-[min(70vh,48rem)] items-center justify-center rounded-2xl border border-destructive/30 bg-muted/30 p-4 md:p-6">
          <p className="text-center text-sm text-destructive">{labels.error}</p>
        </div>
      ) : (
        <div ref={viewerRef} className="min-w-0 overflow-x-hidden">
        <Document
          file={CATALOGUE_PDF_PATH}
          onLoadSuccess={({ numPages: total }) => {
            setNumPages(total);
            setIsDocumentReady(true);
            setLoadError(false);
          }}
          onLoadError={(error) => {
            console.error("Catalogue PDF load error:", error);
            setLoadError(true);
            setIsDocumentReady(false);
          }}
          loading={<CatalogueLoadingSpinner label={labels.loading} />}
          className="w-full"
        >
          {!isDocumentReady ? (
            <div className="flex min-h-[min(70vh,48rem)] w-full items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
              <CatalogueLoadingSpinner label={labels.loading} />
            </div>
          ) : (
            <div
              className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start"
              style={
                {
                  "--catalogue-sidebar-w": `${thumbnailWidth + 16}px`,
                } as CSSProperties
              }
            >
              <div
                ref={thumbContainerRef}
                className={cn(
                  "flex min-w-0 gap-2 overflow-x-auto pb-1 sm:gap-3",
                  "lg:max-h-[min(70vh,48rem)] lg:w-[var(--catalogue-sidebar-w)] lg:shrink-0 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0"
                )}
              >
                {thumbnailPages.map((page) => (
                  <ThumbnailButton
                    key={page}
                    page={page}
                    isActive={page === pageNumber}
                    thumbnailWidth={thumbnailWidth}
                    onSelect={goToPage}
                  />
                ))}
              </div>

              <div
                ref={containerRef}
                className="flex min-h-[min(60vh,40rem)] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-3 md:min-h-[min(70vh,48rem)] md:p-6"
              >
                {pageWidth > 0 ? (
                  <Page
                    key={pageNumber}
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="max-w-full overflow-hidden rounded-lg shadow-[var(--shadow-card)] [&_canvas]:max-w-full"
                  />
                ) : (
                  <CatalogueLoadingSpinner label={labels.loading} />
                )}
              </div>
            </div>
          )}
        </Document>
        </div>
      )}

      <div
        className="flex min-w-0 flex-wrap items-center justify-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-3 shadow-[var(--shadow-subtle)] sm:gap-4 sm:px-4"
        role="toolbar"
        aria-label={labels.navLabel}
      >
        <Button
          type="button"
          variant="outline"
          onClick={goToPrev}
          disabled={isFirstPage || !isDocumentReady}
          className="gap-1.5"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{labels.prev}</span>
        </Button>

        <PageNumberInput
          pageNumber={pageNumber}
          numPages={numPages}
          label={labels.pageInputLabel}
          onSubmit={goToPage}
        />

        <Button
          type="button"
          variant="outline"
          onClick={goToNext}
          disabled={isLastPage || !isDocumentReady}
          className="gap-1.5"
        >
          <span className="hidden sm:inline">{labels.next}</span>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
