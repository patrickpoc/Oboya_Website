import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";
import {
  readMarketplaceCurrencies,
  saveMarketplaceCurrencies,
} from "@/lib/cms/server/marketplace-config.server";
import { readProducts } from "@/lib/cms/server/products.server";
import type { ShopCountry } from "@/lib/shop/types";

class ValidationError extends Error {}

export async function GET() {
  try {
    const data = await readMarketplaceCurrencies();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load currencies" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (isSupabaseConfigured()) {
      const user = await requireAdminUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = (await request.json()) as {
      countries: ShopCountry[];
      currencies: string[];
    };
    const uniqueCurrencies = Array.from(new Set(payload.currencies.map((code) => code.trim().toUpperCase())));
    if (uniqueCurrencies.length === 0) {
      throw new ValidationError("At least one currency is required.");
    }
    uniqueCurrencies.forEach((code) => {
      if (!/^[A-Z]{3,6}$/.test(code)) {
        throw new ValidationError(`Invalid currency code: ${code}`);
      }
    });
    payload.countries.forEach((country) => {
      if (!country.currencies.length) {
        throw new ValidationError(`${country.name} must have at least one allowed currency.`);
      }
      country.currencies.forEach((code) => {
        if (!uniqueCurrencies.includes(code)) {
          throw new ValidationError(`${country.name} uses unknown currency: ${code}`);
        }
      });
      if (!country.currencies.includes(country.defaultCurrency)) {
        throw new ValidationError(`${country.name} default currency must be in allowed currencies list.`);
      }
    });

    const current = await readMarketplaceCurrencies();
    const removedCurrencies = current.currencies.filter((code) => !uniqueCurrencies.includes(code));
    if (removedCurrencies.length > 0) {
      const products = await readProducts({ includeDeleted: false });
      for (const code of removedCurrencies) {
        const activeUsage = products.filter((product) => (product.prices[code] ?? 0) > 0).length;
        if (activeUsage > 0) {
          throw new ValidationError(
            `Currency ${code} has non-zero prices in ${activeUsage} product(s). Set those prices to 0 before removal.`
          );
        }
      }
    }

    const normalizedCountries = payload.countries.map((country) => ({
      ...country,
      currencies: Array.from(new Set(country.currencies.map((code) => code.trim().toUpperCase()))),
      defaultCurrency: country.defaultCurrency.trim().toUpperCase(),
    }));
    const saved = await saveMarketplaceCurrencies({
      countries: normalizedCountries,
      currencies: uniqueCurrencies,
    });
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save currencies" },
      { status: 500 }
    );
  }
}

