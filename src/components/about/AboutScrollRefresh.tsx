"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Recalculate pin distances after below-the-fold About content mounts. */
export function AboutScrollRefresh() {
  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
