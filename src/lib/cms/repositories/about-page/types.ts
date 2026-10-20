import type { LocalizedString } from "@/lib/cms/types";

export type AboutSectionId =
  | "hero"
  | "institutionalImage"
  | "timeline"
  | "impact"
  | "people"
  | "callout"
  | "culture"
  | "mission"
  | "vision"
  | "values"
  | "honors";

export interface AboutSectionToggle {
  enabled: boolean;
}

export interface AboutHeadlineSegment {
  text: LocalizedString;
  tone: "green" | "white";
  breakBefore?: boolean;
}

export interface AboutTimelineEvent {
  id: string;
  year: string;
  description: LocalizedString;
}

export interface AboutCultureItem {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: string;
  imageAlt: LocalizedString;
  /** Image on the right (default) or left — creates the zig-zag */
  imageSide: "left" | "right";
  ctaLabel?: LocalizedString;
  ctaHref?: string;
}

export interface AboutMediaImage {
  src: string;
  alt: LocalizedString;
}

export interface AboutMissionVisionBlock {
  title: LocalizedString;
  body: LocalizedString;
  eyebrow?: LocalizedString;
  images: AboutMediaImage[];
}

export interface AboutValueItem {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: AboutMediaImage;
  /** CSS object-position for the value image, e.g. "center 40%". */
  objectPosition?: string;
}

export interface AboutHonorItem {
  id: string;
  name: string;
  image: string;
  href?: string;
}

export type AboutImpactStatIcon =
  | "globe"
  | "factory"
  | "building"
  | "users"
  | "handshake"
  | "package"
  | "calendar";

export interface AboutImpactStat {
  id: string;
  value: number;
  suffix: string;
  label: LocalizedString;
  icon: AboutImpactStatIcon;
  /** When true, show placeholder instead of counting (unverified). */
  pending?: boolean;
  /** Photography for the Numbers squeeze panel. */
  image: AboutMediaImage;
  /** CSS object-position for the panel image. */
  objectPosition?: string;
  /** Collapsed-panel brand fill (HEX from Oboya palette). */
  accentColor: string;
}

export interface AboutPerson {
  id: string;
  name: string;
  role: LocalizedString;
  image: string;
  bio?: LocalizedString;
}

export interface AboutPageSettings {
  sections: Record<AboutSectionId, AboutSectionToggle>;
  meta: {
    title: LocalizedString;
    description: LocalizedString;
  };
  hero: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    /** Supporting paragraph under the hero title. */
    body?: LocalizedString;
  };
  institutionalImage: {
    src: string;
    alt: LocalizedString;
  };
  timeline: {
    events: AboutTimelineEvent[];
    prevLabel: LocalizedString;
    nextLabel: LocalizedString;
  };
  impact: {
    /** Optional small label above the title. */
    eyebrow?: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    stats: AboutImpactStat[];
  };
  people: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    /** Checklist under the intro (feature-style left column). */
    highlights: Array<{ id: string; text: LocalizedString }>;
    items: AboutPerson[];
  };
  callout: {
    segments: AboutHeadlineSegment[];
    /** Optional secondary line under the statement */
    body?: LocalizedString;
  };
  culture: {
    /** Section heading (e.g. What Makes Oboya Different) */
    title?: LocalizedString;
    eyebrow: LocalizedString;
    items: AboutCultureItem[];
  };
  mission: AboutMissionVisionBlock;
  vision: AboutMissionVisionBlock;
  values: {
    title: LocalizedString;
    image?: AboutMediaImage;
    items: AboutValueItem[];
  };
  honors: {
    title: LocalizedString;
    items: AboutHonorItem[];
  };
  updatedAt: string;
}
