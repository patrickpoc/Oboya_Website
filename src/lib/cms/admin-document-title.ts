"use client";

import { useLayoutEffect } from "react";

const ADMIN_TITLE_SUFFIX = "Oboya Admin";

/** Sets the browser tab title for admin pages. */
export function setAdminDocumentTitle(pageTitle: string) {
  const trimmed = pageTitle.trim();
  document.title = trimmed
    ? `${trimmed} | ${ADMIN_TITLE_SUFFIX}`
    : ADMIN_TITLE_SUFFIX;
}

/** Sync browser title from a page heading (AdminPageHeader / auth forms). */
export function useAdminDocumentTitle(pageTitle: string) {
  useLayoutEffect(() => {
    if (!pageTitle.trim()) return;
    setAdminDocumentTitle(pageTitle);
  }, [pageTitle]);
}
