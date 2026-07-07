import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { getFooterNavigation } from "@/constants/navigation";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/constants/site";

export async function Footer() {
  const t = await getTranslations();
  const footerNavigation = getFooterNavigation((key) => t(key));
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-oboya-soft-white pt-16 pb-8">
      <Container>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo className="mb-6" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {siteConfig.company.address}
              <br />
              {siteConfig.company.email}
            </p>
            <div className="mt-6 flex gap-4">
              <Link
                href={siteConfig.social.linkedin}
                className="text-sm font-medium text-oboya-blue transition-colors hover:text-oboya-green"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("footer.linkedin")}
              </Link>
              <Link
                href={siteConfig.social.facebook}
                className="text-sm font-medium text-oboya-blue transition-colors hover:text-oboya-green"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("footer.facebook")}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-oboya-blue-dark uppercase">
              {t("footer.company")}
            </h3>
            <ul className="flex flex-col gap-3">
              {footerNavigation.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-oboya-green"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-oboya-blue-dark uppercase">
              {t("footer.solutions")}
            </h3>
            <ul className="flex flex-col gap-3">
              {footerNavigation.solutions.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-oboya-green"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {siteConfig.name}. {t("footer.rights")}
          </p>
          <ul className="flex gap-6">
            {footerNavigation.legal.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-oboya-green transition-colors hover:text-oboya-blue"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
