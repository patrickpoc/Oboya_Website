"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { carouselSnapTransition } from "@/lib/animations";

const DRAG_CLICK_THRESHOLD = 8;
const HORIZONTAL_DRAG_THRESHOLD = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export interface UseHorizontalCarouselOptions {
  /** Viewport element used for wheel listener and in-view checks */
  viewportRef: React.RefObject<HTMLElement | null>;
  maxScroll: number;
  /** Distance per snap step (card width + gap) */
  step: number;
  /** Discrete snap positions (e.g. page offsets). When set, drag-end and go() use these. */
  snapOffsets?: number[];
  /** Max index for index-based snapping (BusinessSolutions style) */
  maxIndex?: number;
  animationsEnabled?: boolean;
  /** Snap to nearest position when drag ends (default true) */
  snapOnDragEnd?: boolean;
}

export function useHorizontalCarousel({
  viewportRef,
  maxScroll,
  step,
  snapOffsets,
  maxIndex = 0,
  animationsEnabled = true,
  snapOnDragEnd = true,
}: UseHorizontalCarouselOptions) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHorizontalDrag, setIsHorizontalDrag] = useState(false);
  const [animateSnap, setAnimateSnap] = useState(false);

  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const pointerDeltaX = useRef(0);
  const isHorizontalDragRef = useRef(false);
  const suppressClick = useRef(false);

  useEffect(() => {
    setScrollOffset((prev) => clamp(prev, 0, maxScroll));
  }, [maxScroll]);

  const snapToNearest = useCallback(
    (offset: number, animate: boolean) => {
      if (snapOffsets && snapOffsets.length > 0) {
        let closest = snapOffsets[0];
        let minDist = Infinity;
        for (const candidate of snapOffsets) {
          const dist = Math.abs(candidate - offset);
          if (dist < minDist) {
            minDist = dist;
            closest = candidate;
          }
        }
        if (animate) setAnimateSnap(true);
        setScrollOffset(closest);
        return;
      }

      if (step <= 0) return;
      const index = Math.round(offset / step);
      const clampedIndex = clamp(index, 0, maxIndex);
      if (animate) setAnimateSnap(true);
      setScrollOffset(clampedIndex * step);
    },
    [maxIndex, snapOffsets, step]
  );

  const go = useCallback(
    (direction: -1 | 1) => {
      if (step <= 0 && (!snapOffsets || snapOffsets.length === 0)) return;

      setAnimateSnap(true);
      setScrollOffset((prev) => {
        if (snapOffsets && snapOffsets.length > 0) {
          let currentPage = 0;
          let minDist = Infinity;
          for (let i = 0; i < snapOffsets.length; i++) {
            const dist = Math.abs(snapOffsets[i] - prev);
            if (dist < minDist) {
              minDist = dist;
              currentPage = i;
            }
          }
          let nextPage = currentPage + direction;
          const pageCount = snapOffsets.length;
          if (pageCount <= 1) return 0;
          if (nextPage >= pageCount) nextPage = 0;
          if (nextPage < 0) nextPage = pageCount - 1;
          return snapOffsets[nextPage] ?? 0;
        }

        const currentIndex = Math.round(prev / step);
        let nextIndex = currentIndex + direction;
        if (maxIndex === 0) return 0;
        if (nextIndex > maxIndex) nextIndex = 0;
        if (nextIndex < 0) nextIndex = maxIndex;
        return nextIndex * step;
      });
    },
    [maxIndex, snapOffsets, step]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      let delta = 0;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        delta = event.deltaX;
      } else if (event.shiftKey && event.deltaY !== 0) {
        delta = event.deltaY;
      }
      if (delta === 0) return;

      const rect = viewport.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      event.preventDefault();
      setAnimateSnap(false);
      setScrollOffset((prev) => clamp(prev + delta, 0, maxScroll));
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [maxScroll, viewportRef]);

  const onPointerDown = (event: ReactPointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement | null)?.closest?.("button")) return;

    setAnimateSnap(false);
    pointerStartX.current = event.clientX;
    pointerStartY.current = event.clientY;
    pointerDeltaX.current = 0;
    setDragDelta(0);
    setIsDragging(true);
    setIsHorizontalDrag(false);
    isHorizontalDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    if (pointerStartX.current == null || pointerStartY.current == null) return;

    const deltaX = event.clientX - pointerStartX.current;
    const deltaY = event.clientY - pointerStartY.current;
    pointerDeltaX.current = deltaX;

    if (
      !isHorizontalDragRef.current &&
      Math.abs(deltaX) > HORIZONTAL_DRAG_THRESHOLD &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      isHorizontalDragRef.current = true;
      setIsHorizontalDrag(true);
    }

    if (isHorizontalDragRef.current) {
      setDragDelta(deltaX);
    }
  };

  const finishDrag = () => {
    if (pointerStartX.current == null) return;

    const delta = pointerDeltaX.current;
    const wasHorizontal = isHorizontalDragRef.current;
    pointerStartX.current = null;
    pointerStartY.current = null;
    pointerDeltaX.current = 0;
    isHorizontalDragRef.current = false;
    setIsDragging(false);
    setIsHorizontalDrag(false);
    setDragDelta(0);

    if (wasHorizontal && Math.abs(delta) > DRAG_CLICK_THRESHOLD) {
      suppressClick.current = true;
    }

    if (!wasHorizontal) return;

    setAnimateSnap(false);
    setScrollOffset((prev) => {
      const rawOffset = clamp(prev - delta, 0, maxScroll);
      if (!snapOnDragEnd) return rawOffset;

      if (snapOffsets && snapOffsets.length > 0) {
        let closest = snapOffsets[0];
        let minDist = Infinity;
        for (const candidate of snapOffsets) {
          const dist = Math.abs(candidate - rawOffset);
          if (dist < minDist) {
            minDist = dist;
            closest = candidate;
          }
        }
        return closest;
      }

      if (step <= 0) return rawOffset;
      const index = Math.round(rawOffset / step);
      const clampedIndex = clamp(index, 0, maxIndex);
      return clampedIndex * step;
    });
  };

  const onClickCapture = (event: React.MouseEvent) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  };

  const motionX = -scrollOffset + dragDelta;
  const transition =
    isDragging || !animateSnap || !animationsEnabled
      ? { duration: 0 }
      : carouselSnapTransition;

  const trackClassName = isDragging && isHorizontalDrag ? "cursor-grabbing" : "cursor-grab";
  const trackStyle = {
    touchAction: isHorizontalDrag ? ("none" as const) : ("pan-y" as const),
  };

  return {
    scrollOffset,
    dragDelta,
    isDragging,
    isHorizontalDrag,
    animateSnap,
    motionX,
    transition,
    go,
    snapToNearest,
    trackHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
      onClickCapture,
    },
    trackClassName,
    trackStyle,
    viewportClassName: trackClassName,
  };
}
