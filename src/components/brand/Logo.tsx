"use client";

import Image from "next/image";
import NextLink from "next/link";
import { Link as IntlLink } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "light";
  className?: string;
  priority?: boolean;
  href?: string;
  intl?: boolean;
}

export function Logo({
  variant = "default",
  className,
  priority,
  href = "/",
  intl = true,
}: LogoProps) {
  const LinkComponent = intl ? IntlLink : NextLink;

  return (
    <LinkComponent href={href} className={cn("relative block shrink-0", className)} aria-label="Oboya Horticulture">
      <Image
        src="/assets/logo.svg"
        alt="Oboya Horticulture"
        width={160}
        height={39}
        priority={priority}
        className={cn(
          "h-8 w-auto md:h-9",
          variant === "light" && "brightness-0 invert"
        )}
      />
    </LinkComponent>
  );
}
