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
 * Cookie-free anon client for public reads during static generation.
 * Avoids Dynamic server usage from `cookies()` on prerendered routes.
 */
export function createPublicClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
