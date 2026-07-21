import "@/app/globals.css";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/../messages/en.json";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(fontVariables, "h-full scroll-smooth")}>
      <body className="min-h-full bg-background font-body text-foreground antialiased">
        <NextIntlClientProvider locale="en" messages={enMessages}>
          {children}
        </NextIntlClientProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
