import type { NewsItem } from "@/types";
import { homepageImages } from "@/constants/homepage-images";

export const featuredProducts = [
  {
    id: "strawberry-packaging",
    title: "Strawberry Retail Packaging",
    category: "Packaging",
    image:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800&auto=format&fit=crop",
    href: "/products/strawberry-packaging",
  },
  {
    id: "growing-media",
    title: "Premium Growing Media",
    category: "Substrates",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop",
    href: "/products/growing-media",
  },
  {
    id: "flower-trolley",
    title: "Flower Display Trolley",
    category: "Equipment",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop",
    href: "/products/flower-trolley",
  },
];

export const industries = [
  {
    title: "Commercial Greenhouses",
    description: "Scalable systems for large-scale protected cultivation.",
    href: "/industries/greenhouses",
  },
  {
    title: "Nurseries & Propagation",
    description: "Precision tools for young plant production and rooting.",
    href: "/industries/nurseries",
  },
  {
    title: "Retail & Distribution",
    description: "Packaging and logistics that preserve quality to the shelf.",
    href: "/industries/retail",
  },
  {
    title: "Berry & Soft Fruit",
    description: "Specialized solutions for high-value berry operations.",
    href: "/industries/berries",
  },
] as const;

export const newsItems: NewsItem[] = [
  {
    id: "innovation-1",
    title: "Next-generation greenhouse technology for sustainable production",
    image: homepageImages.greenhouseTechnology,
    href: "/news/greenhouse-technology",
  },
  {
    id: "innovation-2",
    title: "Expanding our footprint in Asia-Pacific markets",
    image: homepageImages.asiaPacificExpansion,
    href: "/news/asia-pacific-expansion",
  },
];

export const certifications = [
  { name: "BRCGS", abbr: "BRCGS" },
  { name: "Sedex", abbr: "Sedex" },
  { name: "SMETA", abbr: "SMETA" },
  { name: "FSC", abbr: "FSC" },
  { name: "ISO", abbr: "ISO" },
] as const;
