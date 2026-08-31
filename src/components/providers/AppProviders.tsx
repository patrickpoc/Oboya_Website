"use client";

import { Suspense } from "react";
import { ShopProvider } from "@/contexts/ShopContext";

/**
 * ShopProvider reads useSearchParams for URL-synced shop state. Next.js
 * requires a Suspense boundary around that hook during static prerender
 * (e.g. /contact via [...slug]), otherwise the build fails with
 * missing-suspense-with-csr-bailout.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ShopProvider>{children}</ShopProvider>
    </Suspense>
  );
}
