import { Navbar } from "@/components/layouts/Navbar";
import { Footer } from "@/components/layouts/Footer";

interface SiteLayoutProps {
  children: React.ReactNode;
  /** Solid navbar palette. Default light matches most marketing pages. */
  navbarSolidTone?: "light" | "dark";
}

export function SiteLayout({
  children,
  navbarSolidTone = "light",
}: SiteLayoutProps) {
  return (
    <>
      <Navbar transparent={false} solidTone={navbarSolidTone} />
      <main className="min-h-screen pt-16 md:pt-20">{children}</main>
      <Footer />
    </>
  );
}
