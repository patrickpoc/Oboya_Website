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
        return fetch(input, {
          ...rest,
          next: {
            revalidate: 3600,
            tags: ["cms-documents"],
          },
        });
      },
    },
  });
}
