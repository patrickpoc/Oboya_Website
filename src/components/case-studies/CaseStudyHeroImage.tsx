import Image from "next/image";
import { Container } from "@/components/ui/container";

interface CaseStudyHeroImageProps {
  src: string;
  alt: string;
}

export function CaseStudyHeroImage({ src, alt }: CaseStudyHeroImageProps) {
  if (!src) return null;

  return (
    <section className="bg-white pb-[clamp(3rem,7vw,5rem)]">
      <Container>
        <div className="relative aspect-[2.35/1] min-h-[180px] w-full overflow-hidden bg-oboya-soft-white md:min-h-[280px]">
          <Image
            src={src}
            alt={alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 80rem"
          />
        </div>
      </Container>
    </section>
  );
}
