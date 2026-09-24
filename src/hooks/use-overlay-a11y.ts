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
 * Uses overflow lock (not position:fixed) to avoid scroll jump on open/close.
 */
export function useOverlayA11y({
  open,
  onClose,
  containerRef,
  lockScroll = true,
  trapFocus = true,
  closeOnEscape = true,
}: {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  /** Lock document body scroll while open. Default true. */
  lockScroll?: boolean;
  /** Trap Tab focus inside the container. Default true. */
  trapFocus?: boolean;
  /** Close on Escape. Default true. */
  closeOnEscape?: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlOverflowX = html.style.overflowX;
    const prevHtmlOverflowY = html.style.overflowY;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverflowX = body.style.overflowX;
    const prevBodyOverflowY = body.style.overflowY;
    const prevBodyPaddingRight = body.style.paddingRight;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    const hadBaseUiLock = html.hasAttribute("data-base-ui-scroll-locked");

    if (lockScroll) {
      const scrollbarWidth = window.innerWidth - html.clientWidth;
      html.style.overflow = "hidden";
      html.style.overflowX = "hidden";
      html.style.overflowY = "hidden";
      body.style.overflow = "hidden";
      body.style.overflowX = "hidden";
      body.style.overflowY = "hidden";
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    const focusContainer = () => {
      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusable(container);
      if (trapFocus) {
        focusables[0]?.focus({ preventScroll: true });
      }
    };

    const rafId = window.requestAnimationFrame(focusContainer);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!closeOnEscape) return;
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
          last.focus({ preventScroll: true });
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (lockScroll) {
        html.style.overflow = prevHtmlOverflow;
        html.style.overflowX = prevHtmlOverflowX;
        html.style.overflowY = prevHtmlOverflowY;
        body.style.overflow = prevBodyOverflow;
        body.style.overflowX = prevBodyOverflowX;
        body.style.overflowY = prevBodyOverflowY;
        body.style.paddingRight = prevBodyPaddingRight;
        body.style.position = prevBodyPosition;
        body.style.top = prevBodyTop;
        body.style.width = prevBodyWidth;
        if (!hadBaseUiLock) {
          html.removeAttribute("data-base-ui-scroll-locked");
        }
      }
      document.removeEventListener("keydown", onKeyDown);
      if (trapFocus) {
        previouslyFocused?.focus?.({ preventScroll: true });
      }
    };
  }, [open, onClose, containerRef, lockScroll, trapFocus, closeOnEscape]);
}
