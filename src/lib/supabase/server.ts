import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Cookie-backed client for auth-aware server routes / admin actions. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll is a no-op when called from a Server Component.
        }
      },
    },
  });
}

/**
 * Cookie-free anon client for public reads.
 * Uses ISR-aligned Data Cache (`revalidate`) so public pages can prerender.
 * CMS writes still bust route cache via `revalidatePath` (see revalidate-site.ts).
 * Keep TTL in sync with `SITE_REVALIDATE_SECONDS` / locale layout `revalidate`.
 */
const PUBLIC_FETCH_TIMEOUT_MS = 12_000;
const PUBLIC_FETCH_RETRIES = 1;

async function fetchWithTimeoutRetry(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  extras: RequestInit
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= PUBLIC_FETCH_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PUBLIC_FETCH_TIMEOUT_MS);
    try {
      const upstream = init?.signal;
      if (upstream) {
        if (upstream.aborted) controller.abort();
        else {
          upstream.addEventListener("abort", () => controller.abort(), {
            once: true,
          });
        }
      }
      return await fetch(input, {
        ...init,
        ...extras,
        signal: controller.signal,
      });
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof Error &&
        (error.name === "AbortError" ||
          /ETIMEDOUT|ECONNRESET|fetch failed/i.test(error.message) ||
          /ETIMEDOUT|ECONNRESET/i.test(String((error as { cause?: unknown }).cause)));
      if (!retryable || attempt === PUBLIC_FETCH_RETRIES) throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Supabase public fetch failed");
}

export function createPublicClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => {
        const { cache: _cache, next: _next, ...rest } = init ?? {};
        void _cache;
        void _next;
        return fetchWithTimeoutRetry(input, rest, {
          next: {
            revalidate: 3600,
            tags: ["cms-documents"],
          },
        });
      },
    },
  });
}
