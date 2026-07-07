import { Navbar } from "@/components/layouts/Navbar";
import { Footer } from "@/components/layouts/Footer";

interface SiteLayoutProps {
  children: React.ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <>
      <Navbar transparent={false} />
      <main className="min-h-screen pt-16 md:pt-20">{children}</main>
      <Footer />
    </>
  );
}
