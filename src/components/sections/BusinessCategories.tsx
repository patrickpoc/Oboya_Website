"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Cherry, Flower2, Sprout } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

const categories = [
  {
    label: "Vegetables & Herbs",
    description:
      "Propagation systems, substrates, and packaging for commercial vegetable and herb production.",
    href: "/solutions/vegetables",
    icon: Sprout,
    accent: "bg-oboya-green/10 text-oboya-green",
  },
  {
    label: "Flowers & Ornamentals",
    description:
      "Complete floriculture solutions — from growing media to retail-ready presentation.",
    href: "/solutions/flowers",
    icon: Flower2,
    accent: "bg-oboya-blue/10 text-oboya-blue",
  },
  {
    label: "Fruits & Berries",
    description:
      "Specialized systems for berry cultivation, fruit packaging, and supply chain efficiency.",
    href: "/solutions/fruits",
    icon: Cherry,
    accent: "bg-oboya-blue-light/10 text-oboya-blue-light",
  },
] as const;

export function BusinessCategories() {
  return (
    <section className="bg-oboya-soft-white py-[var(--section-y-sm)]">
      <Container>
        <SectionTitle
          eyebrow="Our Expertise"
          title="Solutions for every segment of horticulture"
          description="From greenhouse propagation to retail display — tailored systems for growers worldwide."
          align="center"
          className="mb-12 md:mb-16"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.article
                key={category.href}
                variants={fadeInUp}
                className="group flex flex-col rounded-2xl border border-border/60 bg-white p-8 shadow-[var(--shadow-subtle)] transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <div
                  className={cn(
                    "mb-6 flex size-12 items-center justify-center rounded-xl",
                    category.accent
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-oboya-blue-dark">
                  {category.label}
                </h3>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
                <Link
                  href={category.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-oboya-green transition-colors hover:text-oboya-blue"
                >
                  Learn more
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
