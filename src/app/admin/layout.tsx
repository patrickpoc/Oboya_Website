import "@/app/globals.css";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(fontVariables, "h-full scroll-smooth")}>
      <body className="min-h-full bg-background font-body text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
