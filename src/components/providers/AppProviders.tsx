"use client";

import { ShopProvider } from "@/contexts/ShopContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ShopProvider>{children}</ShopProvider>;
}
