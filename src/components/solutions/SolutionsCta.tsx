import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SolutionsCtaProps {
  title: string;
  description: string;
  buttonLabel: string;
  imageSrc: string;
}

export function SolutionsCta({
  title,
  description,
  buttonLabel,
  imageSrc,
}: SolutionsCtaProps) {
  return (
    <section className="relative min-h-[min(70vw,26rem)] overflow-hidden md:min-h-[30rem] lg:min-h-[34rem]">
      <Image
        src={imageSrc}
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div className="relative z-10 flex min-h-[inherit] flex-col items-center justify-center px-[var(--container-padding)] py-16 text-center md:py-20">
        <div className="flex w-full max-w-[var(--container-max)] flex-col items-center gap-6 md:gap-7">
          <h2 className="max-w-3xl font-display text-[clamp(1.5rem,2.9vw,2.375rem)] font-light leading-[1.15] tracking-[-0.02em] text-white text-balance">
            {title}
          </h2>
          <p className="max-w-xl font-body text-[0.9375rem] leading-[1.55] text-oboya-soft-white md:text-lg md:leading-[1.45]">
            {description}
          </p>
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ size: "cta" }),
              "border border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
            )}
          >
            {buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
