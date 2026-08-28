"use client";

import { useLayoutEffect, useRef } from "react";
import { bindDescriptionImageFit } from "@/lib/cms/enhance-description-html";

export function useDescriptionImageFit(content: string) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return bindDescriptionImageFit(container);
  }, [content]);

  return containerRef;
}
