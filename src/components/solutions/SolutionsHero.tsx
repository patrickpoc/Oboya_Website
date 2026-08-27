import { Container } from "@/components/ui/container";

interface SolutionsHeroProps {
  eyebrow: string;
  title: string;
}

export function SolutionsHero({ eyebrow, title }: SolutionsHeroProps) {
  return (
    <section className="bg-[#4DAF4E] pt-[clamp(4.5rem,10vw,7.5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
      <Container>
        <p className="font-body text-[0.9375rem] font-medium leading-relaxed text-white/90 md:text-base">
          {eyebrow}
        </p>
        <div className="mt-5 h-px w-full bg-white/35 md:mt-6" aria-hidden />
        <h1 className="mt-7 max-w-3xl font-display text-[clamp(1.5rem,2.9vw,2.375rem)] font-light leading-[1.35] tracking-[-0.02em] text-white text-pretty md:mt-8 lg:max-w-[72%]">
          {title}
        </h1>
      </Container>
    </section>
  );
}
