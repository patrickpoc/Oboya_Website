import type { Transition } from "framer-motion";
import { easeOutExpo } from "@/lib/animations";

const EASE = [...easeOutExpo] as [number, number, number, number];

/** Shared squeeze duration — do not change when tuning smoothness. */
export const SQUEEZE_BANNER_S = 0.58;

/** Stagger within the same 0.58s window — hide first, layout moves, then reveal. */
const HIDE_S = SQUEEZE_BANNER_S * 0.28;
const REVEAL_DELAY = SQUEEZE_BANNER_S * 0.34;
const REVEAL_S = SQUEEZE_BANNER_S * 0.38;

const tween = (reduceMotion: boolean, duration = SQUEEZE_BANNER_S): Transition =>
  reduceMotion
    ? { duration: 0 }
    : { type: "tween", duration, ease: EASE };

/** Flex grow/basis — layout properties only. */
export function squeezeLayoutTransition(reduceMotion: boolean): Transition {
  return tween(reduceMotion);
}

/** Opacity on overlays that track layout 1:1 (accent wash, gradient). */
export function squeezeLayerTransition(reduceMotion: boolean): Transition {
  return tween(reduceMotion);
}

/** Split transitions so layout + overlays stay in sync without cross-contamination. */
export function squeezeCardTransition(reduceMotion: boolean) {
  const layout = squeezeLayoutTransition(reduceMotion);
  const layer = squeezeLayerTransition(reduceMotion);
  return {
    flexGrow: layout,
    flexBasis: layout,
    default: layer,
  };
}

/**
 * Phased content transition — expanded/collapsed panels never crossfade together.
 * `showing: true` → delayed reveal (after sibling hides). `false` → quick hide.
 */
export function squeezePanelTransition(
  reduceMotion: boolean,
  showing: boolean
): Transition {
  if (reduceMotion) return { duration: 0 };
  return showing
    ? { type: "tween", duration: REVEAL_S, delay: REVEAL_DELAY, ease: EASE }
    : { type: "tween", duration: HIDE_S, delay: 0, ease: EASE };
}

export function squeezeExpandedPanelOpacity(isActive: boolean) {
  return { opacity: isActive ? 1 : 0 };
}

export function squeezeCollapsedPanelOpacity(isActive: boolean) {
  return { opacity: isActive ? 0 : 1 };
}

/** Promote card surface to its own layer; skip paint containment during flex squeeze. */
export const SQUEEZE_CARD_SURFACE_CLASS =
  "isolate [transform:translateZ(0)] [backface-visibility:hidden]";

/** Image/backdrop layer — stable compositor child during card resize. */
export const SQUEEZE_MEDIA_LAYER_CLASS =
  "[transform:translateZ(0)] [backface-visibility:hidden]";

/** Active card stacks above neighbors during coordinated squeeze. */
export function squeezeCardZIndex(isActive: boolean) {
  return isActive ? 2 : 1;
}
