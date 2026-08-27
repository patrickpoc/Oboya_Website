import "server-only";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/routing";

/** Invalidate public locale routes after CMS content mutations. */
export function revalidatePublicSite(extraPaths: string[] = []) {
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    for (const extra of extraPaths) {
      const suffix = extra.startsWith("/") ? extra : `/${extra}`;
      revalidatePath(`/${locale}${suffix}`);
    }
  }
}
