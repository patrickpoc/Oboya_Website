import { Container } from "@/components/ui/container";

interface InnerPageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function InnerPageHero({ eyebrow, title, description }: InnerPageHeroProps) {
  return (
    <section className="border-b border-border/60 bg-oboya-soft-white py-16 md:py-20">
      <Container>
        <p className="mb-4 text-sm font-medium tracking-[0.2em] text-oboya-green uppercase">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl font-display text-[var(--text-heading)] leading-[var(--text-heading-leading)] font-semibold tracking-tight text-oboya-blue-dark text-balance">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-[var(--text-body)] leading-[var(--text-body-leading)] text-muted-foreground">
          {description}
        </p>
      </Container>
    </section>
  );
}
