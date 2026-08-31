"use client";

import { useEffect, useId, useRef } from "react";
import {
  CONNECTION_CYCLE_DURATION_MS,
  MAP_CONNECTION_STYLE,
} from "@/lib/map-connections";

interface AnimatedMapConnectionProps {
  pathD: string;
  animate: boolean;
  delayMs?: number;
  onCycleComplete?: () => void;
}

function placeArrowAtDistance(
  path: SVGPathElement,
  arrow: SVGPolygonElement,
  distance: number,
  opacity: number
) {
  const length = path.getTotalLength();
  if (length <= 0) {
    arrow.setAttribute("opacity", "0");
    return;
  }

  const tipDistance = Math.max(0, Math.min(length, distance));
  const point = path.getPointAtLength(tipDistance);
  const back = path.getPointAtLength(Math.max(0, tipDistance - 1.5));
  const angle =
    (Math.atan2(point.y - back.y, point.x - back.x) * 180) / Math.PI;

  arrow.setAttribute(
    "transform",
    `translate(${point.x} ${point.y}) rotate(${angle})`
  );
  arrow.setAttribute("opacity", String(Math.max(0, Math.min(1, opacity))));
}

/**
 * Maps animation progress (0–1) to visible tip distance along the path,
 * matching the stroke-dashoffset keyframes (draw → hold → erase).
 */
function tipStateForProgress(
  progress: number,
  length: number
): { distance: number; opacity: number } {
  const p = Math.max(0, Math.min(1, progress));

  if (p < 0.38) {
    const distance = (p / 0.38) * length;
    return {
      distance,
      opacity: distance < 2 ? 0 : MAP_CONNECTION_STYLE.opacity,
    };
  }

  if (p < 0.52) {
    return { distance: length, opacity: MAP_CONNECTION_STYLE.opacity };
  }

  if (p < 0.92) {
    const eraseT = (p - 0.52) / (0.92 - 0.52);
    return {
      distance: length,
      opacity: MAP_CONNECTION_STYLE.opacity * (1 - eraseT),
    };
  }

  return { distance: length, opacity: 0 };
}

/**
 * Draws a curved arrow connection from origin → destination with a soft glow,
 * holds briefly, then erases from the origin toward the destination.
 */
export function AnimatedMapConnection({
  pathD,
  animate,
  delayMs = 0,
  onCycleComplete,
}: AnimatedMapConnectionProps) {
  const glowRef = useRef<SVGPathElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const arrowRef = useRef<SVGPolygonElement>(null);
  const onCompleteRef = useRef(onCycleComplete);
  onCompleteRef.current = onCycleComplete;
  const reactId = useId();
  const filterId = `map-conn-glow-${reactId.replace(/:/g, "")}`;

  useEffect(() => {
    const path = pathRef.current;
    const glow = glowRef.current;
    const arrow = arrowRef.current;
    if (!path || !glow || !arrow) return;

    const length = path.getTotalLength();

    if (!animate) {
      path.style.strokeDasharray = "4 6";
      path.style.strokeDashoffset = "0";
      glow.style.strokeDasharray = "4 6";
      glow.style.strokeDashoffset = "0";
      placeArrowAtDistance(path, arrow, length, MAP_CONNECTION_STYLE.opacity);
      return;
    }

    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    glow.style.strokeDasharray = String(length);
    glow.style.strokeDashoffset = String(length);
    placeArrowAtDistance(path, arrow, 0, 0);

    const keyframes: Keyframe[] = [
      { strokeDashoffset: length, offset: 0 },
      { strokeDashoffset: 0, offset: 0.38 },
      { strokeDashoffset: 0, offset: 0.52 },
      { strokeDashoffset: -length, offset: 0.92 },
      { strokeDashoffset: -length, offset: 1 },
    ];

    const timing: KeyframeAnimationOptions = {
      duration: CONNECTION_CYCLE_DURATION_MS,
      delay: delayMs,
      easing: "linear",
      fill: "forwards",
    };

    const pathAnimation = path.animate(keyframes, timing);
    const glowAnimation = glow.animate(keyframes, timing);

    let frame = 0;
    const tick = () => {
      const currentTime = pathAnimation.currentTime;
      if (typeof currentTime === "number") {
        const elapsed = Math.max(0, currentTime - delayMs);
        const progress = Math.min(1, elapsed / CONNECTION_CYCLE_DURATION_MS);
        const tip = tipStateForProgress(progress, length);
        placeArrowAtDistance(path, arrow, tip.distance, tip.opacity);
      }

      if (pathAnimation.playState !== "finished") {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);

    const handleFinish = () => {
      cancelAnimationFrame(frame);
      onCompleteRef.current?.();
    };

    pathAnimation.addEventListener("finish", handleFinish);

    return () => {
      cancelAnimationFrame(frame);
      pathAnimation.removeEventListener("finish", handleFinish);
      pathAnimation.cancel();
      glowAnimation.cancel();
    };
  }, [pathD, animate, delayMs]);

  const size = MAP_CONNECTION_STYLE.arrowSize;
  const arrowPoints = `0,0 ${-size},${size * 0.45} ${-size * 0.4},0 ${-size},${-size * 0.45}`;

  return (
    <g>
      <defs>
        <filter
          id={filterId}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        ref={glowRef}
        d={pathD}
        fill="none"
        stroke={MAP_CONNECTION_STYLE.stroke}
        strokeWidth={MAP_CONNECTION_STYLE.glowStrokeWidth}
        strokeLinecap="round"
        opacity={MAP_CONNECTION_STYLE.glowOpacity}
        filter={`url(#${filterId})`}
      />

      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={MAP_CONNECTION_STYLE.stroke}
        strokeWidth={MAP_CONNECTION_STYLE.strokeWidth}
        strokeLinecap="round"
        opacity={MAP_CONNECTION_STYLE.opacity}
      />

      <polygon
        ref={arrowRef}
        points={arrowPoints}
        fill={MAP_CONNECTION_STYLE.stroke}
        stroke={MAP_CONNECTION_STYLE.stroke}
        strokeWidth={0.4}
        strokeLinejoin="round"
        opacity={0}
      />
    </g>
  );
}
