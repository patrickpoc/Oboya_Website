import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware";
import { isHostedRuntime } from "@/lib/security/runtime";

const intlMiddleware = createIntlMiddleware(routing);

function withSecureLocaleCookie(request: NextRequest, response: NextResponse) {
  const locale = response.cookies.get("NEXT_LOCALE")?.value;
  if (!locale) return response;
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hosted = isHostedRuntime();
  const requestHeaders = new Headers(request.headers);
  if (pathname.startsWith("/admin")) {
    requestHeaders.set("x-admin-pathname", pathname);
  }

  if (hosted && !isSupabaseConfigured() && pathname.startsWith("/admin")) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  if (
    isSupabaseConfigured() &&
    (pathname.startsWith("/admin") || pathname.startsWith("/auth"))
  ) {
    return updateSession(request, requestHeaders);
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return withSecureLocaleCookie(request, intlMiddleware(request));
}

/**
 * `/api` is excluded: route handlers enforce auth themselves (requireCmsAuth
 * also returns 503 when Supabase is unconfigured), so running the proxy there
 * only added an invocation per API call.
 */
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
