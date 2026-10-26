/**
 * Full-page navigation (intentionally NOT router.push). Used by admin auth flows so the
 * refreshed session cookie is read by the proxy and all client-side state is discarded.
 * See next/dist/docs/01-app/02-guides/preserving-ui-state.md ("logout flows").
 */
export function hardNavigate(path: string): void {
  window.location.href = path;
}
