import "@/app/globals.css";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { AdminIntlProvider } from "@/contexts/AdminLocaleContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(fontVariables, "h-full scroll-smooth")}>
      <body className="min-h-full bg-background font-body text-foreground antialiased">
        <AdminIntlProvider>{children}</AdminIntlProvider>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}
