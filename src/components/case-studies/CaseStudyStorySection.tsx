import Image from "next/image";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export type StoryImagePosition = "left" | "right";

interface CaseStudyStorySectionProps {
  imageSrc: string;
  imageAlt: string;
  imagePosition?: StoryImagePosition;
  children: React.ReactNode;
}

export function CaseStudyStorySection({
  imageSrc,
  imageAlt,
  imagePosition = "right",
  children,
}: CaseStudyStorySectionProps) {
  const imageLeft = imagePosition === "left";

  return (
    <section className="overflow-x-clip bg-white py-[clamp(3rem,7vw,5.5rem)]">
      <Container>
        <div className="mx-auto grid w-full min-w-0 grid-cols-12 items-center gap-x-4 sm:gap-x-6 md:gap-x-9 lg:w-[90%] lg:gap-x-[3.15rem] xl:gap-x-[3.6rem]">
          <div
            className={cn(
              "relative col-span-6 min-w-0",
              imageLeft ? "col-start-1" : "col-start-7"
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-[#e8ebe9]",
                imageLeft
                  ? "translate-x-[-0.4rem] translate-y-[0.4rem] sm:translate-x-[-0.75rem] sm:translate-y-[0.75rem] md:translate-x-[-1.1rem] md:translate-y-[1.1rem]"
                  : "translate-x-[0.4rem] translate-y-[0.4rem] sm:translate-x-[0.75rem] sm:translate-y-[0.75rem] md:translate-x-[1.1rem] md:translate-y-[1.1rem]"
              )}
              aria-hidden
            />
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-oboya-soft-white">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 45vw, 43vw"
              />
            </div>
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-col gap-6 sm:gap-8 md:gap-10 col-span-6",
              imageLeft ? "col-start-7" : "col-start-1 row-start-1"
            )}
          >
            {children}
          </div>
        </div>
      </Container>
    </section>
  );
}
