"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getFocusable(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

/**
 * Escape to close, focus trap, body scroll lock, and restore focus on unmount.
 */
export function useOverlayA11y({
  open,
  onClose,
  containerRef,
  lockScroll = true,
  trapFocus = true,
}: {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  /** Lock document body scroll while open. Default true. */
  lockScroll?: boolean;
  /** Trap Tab focus inside the container. Default true. */
  trapFocus?: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const scrollY = window.scrollY;

    if (lockScroll) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    }

    const focusContainer = () => {
      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusable(container);
      if (trapFocus) {
        focusables[0]?.focus();
      }
    };

    const rafId = window.requestAnimationFrame(focusContainer);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (!trapFocus || event.key !== "Tab" || !containerRef.current) return;

      const container = containerRef.current;
      const items = getFocusable(container);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (lockScroll) {
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.top = prevTop;
        document.body.style.width = prevWidth;
        window.scrollTo(0, scrollY);
      }
      document.removeEventListener("keydown", onKeyDown);
      if (trapFocus) {
        previouslyFocused?.focus?.();
      }
    };
  }, [open, onClose, containerRef, lockScroll, trapFocus]);
}
