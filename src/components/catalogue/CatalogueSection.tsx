"use client";

import dynamic from "next/dynamic";
import { CatalogueLoadingSpinner } from "@/components/catalogue/CatalogueLoadingSpinner";

const CatalogueViewer = dynamic(
  () =>
    import("@/components/catalogue/CatalogueViewer").then(
      (module) => module.CatalogueViewer
    ),
  {
    ssr: false,
    loading: () => <CatalogueLoadingSpinner />,
  }
);

interface CatalogueSectionProps {
  labels: {
    prev: string;
    next: string;
    navLabel: string;
    pageInputLabel: string;
    loading: string;
    error: string;
  };
}

export function CatalogueSection({ labels }: CatalogueSectionProps) {
  return <CatalogueViewer labels={labels} />;
}
