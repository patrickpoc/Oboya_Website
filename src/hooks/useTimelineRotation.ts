"use client";

/**
 * Items sit at angle i * (360 / n).
 * Angle 0 = top (12 o'clock). Container rotates so the active item stays at the apex.
 */

export const TIMELINE_FOCUS_ANGLE = 0;

export function getItemAngle(index: number, count: number): number {
  if (count <= 0) return 0;
  return (360 / count) * index;
}

export function getContainerRotation(
  activeIndex: number,
  count: number,
  focusAngle = TIMELINE_FOCUS_ANGLE
): number {
  if (count <= 0) return 0;
  return focusAngle - getItemAngle(activeIndex, count);
}

export function getRotationFromProgress(
  progress: number,
  count: number,
  focusAngle = TIMELINE_FOCUS_ANGLE
): number {
  if (count <= 1) return focusAngle;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const indexFloat = clamped * (count - 1);
  return focusAngle - (360 / count) * indexFloat;
}

export function getActiveIndexFromProgress(progress: number, count: number): number {
  if (count <= 1) return 0;
  const clamped = Math.min(Math.max(progress, 0), 1);
  return Math.round(clamped * (count - 1));
}

export function useTimelineRotation(activeIndex: number, count: number) {
  return {
    itemAngle: getItemAngle(activeIndex, count),
    containerRotation: getContainerRotation(activeIndex, count),
    stepDegrees: count > 0 ? 360 / count : 0,
    getItemAngle: (index: number) => getItemAngle(index, count),
  };
}
