import type { Metadata } from "next";
import "@/app/globals.css";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { AdminIntlProvider } from "@/contexts/AdminLocaleContext";
import { ConditionalAnalytics } from "@/components/privacy/ConditionalAnalytics";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(fontVariables, "h-full scroll-smooth")}>
      <body className="min-h-full bg-background font-body text-foreground antialiased">
        <AdminIntlProvider>
          {children}
          <CookieConsentBanner />
        </AdminIntlProvider>
        <Toaster position="top-right" richColors />
        <ConditionalAnalytics />
      </body>
    </html>
  );
}
