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
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          <div
            className={cn(
              "flex flex-col gap-10 lg:col-span-5",
              imageLeft
                ? "order-2 lg:order-2 lg:col-start-8"
                : "order-2 lg:order-1 lg:col-start-1"
            )}
          >
            {children}
          </div>

          <div
            className={cn(
              "relative w-full max-w-full lg:col-span-6",
              imageLeft
                ? "order-1 lg:order-1 lg:col-start-1"
                : "order-1 lg:order-2 lg:col-start-7"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-[#e8ebe9]",
                imageLeft
                  ? "-translate-x-3 -translate-y-3 sm:-translate-x-5 sm:-translate-y-5"
                  : "translate-x-3 translate-y-3 sm:translate-x-5 sm:translate-y-5"
              )}
              aria-hidden
            />
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-oboya-soft-white sm:aspect-[5/6]">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 48vw"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
