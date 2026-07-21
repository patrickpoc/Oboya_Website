"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { pickLocalized } from "@/lib/cms/utils";

interface PartnersProps {
  data: HomepageSettings["partners"];
  locale: string;
  animationsEnabled?: boolean;
}

function LogoItem({
  logo,
  decorative = false,
}: {
  logo: HomepageSettings["partners"]["logos"][number];
  decorative?: boolean;
}) {
  const content = logo.image ? (
    <Image
      src={logo.image}
      alt={decorative ? "" : logo.name}
      width={200}
      height={80}
      className="h-14 w-auto max-w-[11rem] object-contain sm:h-16 sm:max-w-[14rem] md:h-20 md:max-w-[17rem]"
    />
  ) : (
    <span className="text-base font-bold tracking-wider text-oboya-blue-dark/50 uppercase md:text-lg">
      {logo.name}
    </span>
  );

  return (
    <li className="flex h-16 flex-1 items-center justify-center sm:h-20 md:h-24">
      {logo.href && !decorative ? (
        <Link href={logo.href} className="transition-opacity hover:opacity-90">
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}

export function Partners({
  data,
  locale,
  animationsEnabled = true,
}: PartnersProps) {
  const logos = data.logos;
  const motionInitial = animationsEnabled ? "hidden" : false;
  const motionWhileInView = animationsEnabled ? "visible" : undefined;

  return (
    <section className="bg-white py-[var(--section-y)]">
      <Container>
        <motion.div
          initial={motionInitial}
          whileInView={motionWhileInView}
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeInUp}
          className="flex flex-col items-center gap-8 md:gap-14"
        >
          <h2 className="max-w-2xl text-center font-display text-[clamp(1.5rem,2.8vw,2.25rem)] font-black tracking-tight text-oboya-blue-dark text-balance">
            {pickLocalized(data.title, locale)}
          </h2>
        </motion.div>
      </Container>

      {animationsEnabled ? (
        <div
          className="relative mt-8 w-full overflow-hidden md:mt-14"
          aria-label={pickLocalized(data.title, locale)}
        >
          <div className="partners-marquee-track flex">
            {/* Primary set — fills the viewport edge to edge */}
            <ul className="flex w-full min-w-full shrink-0 items-center px-[var(--container-padding)]">
              {logos.map((logo) => (
                <LogoItem key={logo.id} logo={logo} />
              ))}
            </ul>
            {/* Clone for seamless loop only — hidden from a11y, never “extra” logos on screen */}
            <ul
              className="flex w-full min-w-full shrink-0 items-center px-[var(--container-padding)]"
              aria-hidden
            >
              {logos.map((logo) => (
                <LogoItem key={`loop-${logo.id}`} logo={logo} decorative />
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <Container className="mt-8 md:mt-14">
          <ul
            className="flex w-full flex-wrap items-center justify-center gap-8 px-[var(--container-padding)] sm:gap-10 md:gap-12"
            aria-label={pickLocalized(data.title, locale)}
          >
            {logos.map((logo) => (
              <LogoItem key={logo.id} logo={logo} />
            ))}
          </ul>
        </Container>
      )}
    </section>
  );
}
