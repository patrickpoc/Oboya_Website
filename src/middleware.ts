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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hosted = isHostedRuntime();
  const requestHeaders = new Headers(request.headers);
  if (pathname.startsWith("/admin")) {
    requestHeaders.set("x-admin-pathname", pathname);
  }

  if (
    hosted &&
    !isSupabaseConfigured() &&
    (pathname.startsWith("/admin") || pathname.startsWith("/api/cms"))
  ) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  if (
    isSupabaseConfigured() &&
    (pathname.startsWith("/admin") || pathname.startsWith("/auth"))
  ) {
    return updateSession(request, requestHeaders);
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/admin")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return withSecureLocaleCookie(request, intlMiddleware(request));
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
