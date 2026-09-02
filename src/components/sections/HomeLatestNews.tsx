"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { fadeInUp, staggerContainer, revealViewport } from "@/lib/animations";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import { pickLocalized } from "@/lib/cms/utils";

interface HomeLatestNewsProps {
  data: HomepageSettings["latestNews"];
  posts: CmsBlogPost[];
  locale: string;
  animationsEnabled?: boolean;
}

export function HomeLatestNews({
  data,
  posts,
  locale,
  animationsEnabled = true,
}: HomeLatestNewsProps) {
  const items = posts.slice(0, data.postCount);
  const motionInitial = animationsEnabled ? "hidden" : false;
  const motionWhileInView = animationsEnabled ? "visible" : undefined;

  return (
    <section className="bg-oboya-soft-white py-12 md:py-16 lg:py-20">
      <Container>
        <motion.div
          initial={motionInitial}
          whileInView={motionWhileInView}
          viewport={revealViewport}
          variants={fadeInUp}
          className="mb-7 md:mb-9"
        >
          <div className="mb-6 flex flex-col gap-3">
            <p className="text-sm font-medium tracking-wide text-oboya-green">
              {pickLocalized(data.eyebrow, locale)}
            </p>
            <div className="h-px w-full bg-oboya-blue-dark/15" aria-hidden />
          </div>
          <h2 className="max-w-4xl font-display text-[clamp(1.45rem,2.6vw,2.15rem)] leading-[1.35] font-light tracking-tight text-oboya-blue-dark text-balance">
            {pickLocalized(data.headline, locale)}
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial={motionInitial}
          whileInView={motionWhileInView}
          viewport={revealViewport}
          className="grid gap-5 md:grid-cols-2 md:gap-6"
        >
          {items.map((post) => (
            <motion.article key={post.id} variants={fadeInUp}>
              <Link
                href={`/news/${post.slug}`}
                className="group block"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt={pickLocalized(post.title, locale)}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-oboya-blue/20 to-oboya-green/20" />
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-oboya-blue-dark transition-colors group-hover:text-oboya-green md:text-lg">
                    {pickLocalized(post.title, locale)}
                  </h3>
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-oboya-blue-dark/25 text-oboya-blue-dark transition-colors group-hover:border-oboya-green group-hover:bg-oboya-green/10 group-hover:text-oboya-green"
                    aria-hidden
                  >
                    <ChevronRight className="size-4" />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
