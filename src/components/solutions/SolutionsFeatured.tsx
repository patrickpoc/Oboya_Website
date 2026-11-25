"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { fadeInUp } from "@/lib/animations";

export interface FeaturedItem {
  id: string;
  href: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  imageSrc: string;
}

interface SolutionsFeaturedProps {
  title: string;
  tagLabel: string;
  readLabel: string;
  items: FeaturedItem[];
}

const tagClass =
  "border border-oboya-blue-dark/15 bg-white px-2 py-1 text-xs font-semibold leading-none";

export function SolutionsFeatured({
  title,
  tagLabel,
  readLabel,
  items,
}: SolutionsFeaturedProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="bg-white py-[clamp(2.5rem,5vw,4.5rem)]">
      <Container>
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-80px" }}
          variants={reduceMotion ? undefined : fadeInUp}
        >
          <h2 className="font-body text-base font-semibold text-oboya-green">
            {title}
          </h2>
          <div className="mt-4 h-px w-full bg-oboya-green-light/70" aria-hidden />
          <ul className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <article className="group relative flex h-full flex-col">
                  <div className="relative aspect-[3/2] overflow-hidden bg-oboya-soft-white">
                    <Image
                      src={item.imageSrc}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute left-3 right-3 top-3 flex flex-wrap items-start gap-2 [&>span]:whitespace-nowrap">
                      <span className={`${tagClass} uppercase text-oboya-green`}>
                        {tagLabel}
                      </span>
                      {item.category ? (
                        <span className={`${tagClass} text-oboya-blue-light`}>
                          {item.category}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col bg-oboya-soft-white p-7">
                    <h3 className="font-body text-[15px] font-semibold text-oboya-blue-dark">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-body text-sm text-oboya-blue">
                      {item.date}
                    </p>
                    <p className="mt-3 line-clamp-3 font-body text-sm leading-relaxed text-oboya-blue-dark">
                      {item.excerpt}
                    </p>
                    <Link
                      href={item.href}
                      className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-oboya-blue-dark after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-oboya-blue-light"
                    >
                      <span className="underline underline-offset-2">
                        {readLabel}
                      </span>
                      <ArrowRight className="size-4" aria-hidden />
                      <span className="sr-only">: {item.title}</span>
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </motion.div>
      </Container>
    </section>
  );
}
