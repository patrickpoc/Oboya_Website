"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type {
  HomeEcosystemStage,
  HomeEcosystemStageId,
} from "@/lib/cms/repositories/homepage-repository";
import { Growing } from "./growing";
import { Harvest } from "./harvest";
import { Logistics } from "./logistics";
import { Packaging } from "./packaging";
import { Propagation } from "./propagation";
import { Retail } from "./retail";

/**
 * Code-built, label-free illustrations, one per stage. Brand tokens only.
 * Shared kit: 800x400 canvas (2:1), one baseline, one top-left light.
 * Every animation is finite and ends on the complete frame (`st` renders it directly).
 */
const SCENES: Record<HomeEcosystemStageId, (p: { st: boolean }) => ReactNode> = {
  propagation: Propagation,
  growing: Growing,
  harvest: Harvest,
  packaging: Packaging,
  logistics: Logistics,
  retail: Retail,
};

/** CMS image when set, otherwise the animated (or static) scene. Fills its parent. */
export function HomeEcosystemStageVisual({
  stage,
  label,
  static: st = false,
  sizes,
  eager = false,
}: {
  stage: HomeEcosystemStage;
  label: string;
  static?: boolean;
  sizes?: string;
  eager?: boolean;
}) {
  if (stage.image) {
    return (
      <Image
        src={stage.image}
        alt={label}
        fill
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        className="object-cover object-center"
      />
    );
  }
  const Scene = SCENES[stage.id];
  return <Scene st={st} />;
}
