import "server-only";

import { unstable_rethrow } from "next/navigation";
import {
  DynamicServerError,
  isDynamicServerError,
} from "next/dist/client/components/hooks-server-context";

/**
 * Next throws DynamicServerError during SSG when a route uses no-store fetch.
 * Catch blocks must rethrow it so Next can opt the route into dynamic rendering.
 * Supabase/client wrappers sometimes strip `digest`, so also match by message.
 */
export function rethrowNextSignals(error: unknown): void {
  unstable_rethrow(error);

  if (isDynamicServerError(error)) {
    throw error;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!message.includes("Dynamic server usage:")) {
    return;
  }

  const description = message
    .replace(/^Error:\s*/i, "")
    .replace(/^Dynamic server usage:\s*/i, "");
  throw new DynamicServerError(description);
}
