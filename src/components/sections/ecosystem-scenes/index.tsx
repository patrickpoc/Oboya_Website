"use client";

import Image from "next/image";
import { memo, type ReactNode } from "react";
import type {
  HomeEcosystemStage,
  HomeEcosystemStageId,
} from "@/lib/cms/repositories/homepage-repository";
import { Growing } from "./growing";
import { Harvest } from "./harvest";
import type { SceneProps } from "./iso-kit";
import { Logistics } from "./logistics";
import { Packaging } from "./packaging";
import { Propagation } from "./propagation";
import { Retail } from "./retail";

export { Backdrop } from "./backdrop";
export { Overview } from "./overview";
export { HOTSPOTS } from "./hotspots";
export { SceneClock } from "./iso-kit";

/**
 * Code-built, label-free illustrations, one per stage, drawn on the shared isometric plate
 * (see iso-kit.tsx and backdrop.tsx). Brand tokens only, every animation finite;
 * `st` renders the complete frame directly. `active` is the hovered proof point.
 */
const SCENES: Record<HomeEcosystemStageId, (p: SceneProps) => ReactNode> = {
  propagation: Propagation,
  growing: Growing,
  harvest: Harvest,
  packaging: Packaging,
  logistics: Logistics,
  retail: Retail,
};

/**
 * CMS image when set, otherwise the animated (or static) scene. Fills its parent.
 * Memoised: it re-renders only when `static` or `active` (hovered proof point) change.
 */
export const HomeEcosystemStageVisual = memo(function HomeEcosystemStageVisual({
  stage,
  label,
  static: st = false,
  active = null,
  sizes,
  eager = false,
}: {
  stage: HomeEcosystemStage;
  label: string;
  static?: boolean;
  active?: number | null;
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
  return <Scene st={st} active={active} />;
});
