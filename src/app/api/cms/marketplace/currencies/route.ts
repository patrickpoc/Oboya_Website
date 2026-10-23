import { NextResponse } from "next/server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  readMarketplaceCurrencies,
  saveMarketplaceCurrencies,
} from "@/lib/cms/server/marketplace-config.server";
import { readProducts } from "@/lib/cms/server/products.server";
import {
  CountriesValidationError,
  countProductsByCountry,
  normalizeCountriesPayload,
  sameCountries,
  snapshotAffectedCountries,
  splitRestrictiveCountryChanges,
} from "@/lib/cms/marketplace-countries";
import {
  approvalErrorResponse,
  toPendingInfo,
  requiresApprovalFor,
  submitChangeRequest,
} from "@/lib/cms/server/approvals.server";
import { diffJson, summarizeDiff } from "@/lib/cms/approvals/diff";
import { readMapLocations } from "@/lib/map-locations.server";
import { publicApiError } from "@/lib/security/public-error";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { logCmsPerf } from "@/lib/cms/server/perf-log.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Inactive countries and product counts are admin-only.
    if (new URL(request.url).searchParams.get("includeInactive") === "1") {
      const auth = await cmsGuard("marketplace", "view");
      if ("response" in auth) return auth.response;
      const [data, products] = await Promise.all([
        readMarketplaceCurrencies({ includeInactive: true }),
        readProducts({
          includeDeleted: false,
          fields: "list",
          skipPurge: true,
          asAdmin: true,
        }),
      ]);
      return NextResponse.json(
        { ...data, productCounts: countProductsByCountry(products) },
        { headers: noStoreHeaders }
      );
    }
    const data = await readMarketplaceCurrencies();
    return NextResponse.json(data, { headers: noStoreHeaders });
  } catch (error) {
    return publicApiError(error, "Failed to load currencies");
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await cmsGuard("marketplace", "edit");
    if ("response" in auth) return auth.response;
    const payload = (await request.json().catch(() => null)) as {
      countries: unknown;
      currencies: unknown;
    } | null;
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const started = Date.now();
    const current = await readMarketplaceCurrencies({ includeInactive: true });
    // If the map can't be read, keep each country's previous primary office.
    const offices = await readMapLocations()
      .then(
        (mapData) =>
          new Map(
            mapData.locations.flatMap((location) =>
              location.offices.map((office) => [office.id, location.flag] as const)
            )
          )
      )
      .catch((error) => {
        console.error("Map locations unavailable for countries save:", error);
        return null;
      });
    const {
      countries: normalizedCountries,
      currencies: uniqueCurrencies,
      warnings,
    } = normalizeCountriesPayload(payload, offices, current.countries);

    const removedCurrencies = current.currencies.filter((code) => !uniqueCurrencies.includes(code));
    if (removedCurrencies.length > 0) {
      const products = await readProducts({
        includeDeleted: false,
        fields: "list",
        skipPurge: true,
        asAdmin: true,
      });
      for (const code of removedCurrencies) {
        const activeUsage = products.filter((product) => (product.prices[code] ?? 0) > 0).length;
        if (activeUsage > 0) {
          throw new CountriesValidationError(
            `Currency ${code} has non-zero prices in ${activeUsage} product(s). Set those prices to 0 before removal.`
          );
        }
      }
    }

    // Deactivating or removing countries needs approval when a policy requires it.
    const split = splitRestrictiveCountryChanges(current.countries, normalizedCountries);
    const held =
      split.deactivate.length + split.remove.length > 0 &&
      (await requiresApprovalFor(auth.user, "marketplace.countries"));
    const toSave = held ? split.direct : normalizedCountries;

    // Held countries keep their currencies, so the global list must still contain them.
    const currenciesToSave = Array.from(
      new Set([...uniqueCurrencies, ...toSave.flatMap((c) => c.currencies)])
    );
    const saved = await saveMarketplaceCurrencies({
      countries: toSave,
      currencies: currenciesToSave,
    });
    let pendingApproval: ReturnType<typeof toPendingInfo> | undefined;
    if (held) {
      const entries = diffJson(
        { countries: current.countries.map((c) => ({ id: c.code, active: c.active !== false })) },
        {
          countries: current.countries
            .filter((c) => !split.remove.includes(c.code))
            .map((c) => ({ id: c.code, active: !split.deactivate.includes(c.code) })),
        }
      );
      const request = await submitChangeRequest({
        user: auth.user,
        changeType: "marketplace.countries",
        entityId: "countries",
        entityLabel: "Countries",
        action: "update",
        payload: { deactivate: split.deactivate, remove: split.remove },
        snapshot: snapshotAffectedCountries(current.countries, split),
        diff: { entries },
        summary: summarizeDiff(entries),
      });
      pendingApproval = toPendingInfo(request);
    }
    logCmsPerf("PUT /api/cms/marketplace/currencies", started, {
      currencies: uniqueCurrencies.length,
      countries: normalizedCountries.length,
      productsTouched: Array.isArray(saved.products) ? saved.products.length : undefined,
    });
    // 202 only when the whole save is held; otherwise the rest was saved directly.
    const heldOnly =
      held && sameCountries(toSave, current.countries);
    return NextResponse.json(
      { ...saved, warnings, ...(pendingApproval ? { pendingApproval } : {}) },
      { status: heldOnly ? 202 : 200 }
    );
  } catch (error) {
    if (error instanceof CountriesValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return approvalErrorResponse(error, "Failed to save currencies");
  }
}

