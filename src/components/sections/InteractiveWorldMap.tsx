"use client";

import { Mouse } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAP_VIEWBOX, type ResolvedMapLocation } from "@/lib/map-locations";
import { MapLocationInfoPanel } from "@/components/sections/MapLocationInfoPanel";
import { CountryFlag } from "@/components/ui/country-flag";
import { screenToSvg } from "@/lib/svg-coords";
import { cn } from "@/lib/utils";

const AUTO_CYCLE_INTERVAL_MS = 4000;
const HOVER_RESUME_DELAY_MS = 10_000;
const TAP_RESUME_DELAY_MS = 30_000;
const SELECTION_FADE_MS = 350;
const FLAG_WIDTH_RATIO = 0.044;
const FLAG_OFFSET_RATIO = 0.022;
const FLAG_MIN_WIDTH_PX = 14;
const FLAG_MAX_WIDTH_PX = 28;

export interface InteractiveWorldMapProps {
  locations: ResolvedMapLocation[];
  mapAlt: string;
  interactiveHint?: string;
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onMapClick?: (x: number, y: number) => void;
}

export function InteractiveWorldMap({
  locations,
  mapAlt,
  interactiveHint,
  editable = false,
  selectedId = null,
  onSelect,
  onMove,
  onMapClick,
}: InteractiveWorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });

  const highlightedId = editable ? selectedId : activeId;
  const autoPlayEnabled = !editable && !manualMode && !prefersReducedMotion;

  const flagWidth =
    mapSize.width > 0
      ? Math.min(
          FLAG_MAX_WIDTH_PX,
          Math.max(FLAG_MIN_WIDTH_PX, mapSize.width * FLAG_WIDTH_RATIO)
        )
      : FLAG_MAX_WIDTH_PX;
  const flagOffset =
    mapSize.height > 0
      ? Math.max(4, mapSize.height * FLAG_OFFSET_RATIO)
      : 10;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setMapSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
    setPrefersReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const scheduleResumeAutoPlay = useCallback(
    (delayMs: number) => {
      clearResumeTimer();
      resumeTimerRef.current = setTimeout(() => {
        resumeTimerRef.current = null;
        setManualMode(false);
      }, delayMs);
    },
    [clearResumeTimer]
  );

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  useEffect(() => {
    if (!autoPlayEnabled || locations.length === 0) return;

    let index = 0;
    setActiveId(locations[0].id);

    const interval = window.setInterval(() => {
      index = (index + 1) % locations.length;
      setActiveId(locations[index].id);
    }, AUTO_CYCLE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [autoPlayEnabled, locations]);

  const handleHoverStart = useCallback(
    (id: string) => {
      if (editable || isTouch) return;
      clearResumeTimer();
      setManualMode(true);
      setActiveId(id);
    },
    [clearResumeTimer, editable, isTouch]
  );

  const handleHoverEnd = useCallback(() => {
    if (editable || isTouch) return;
    scheduleResumeAutoPlay(HOVER_RESUME_DELAY_MS);
  }, [editable, isTouch, scheduleResumeAutoPlay]);

  const handleManualSelect = useCallback(
    (id: string) => {
      if (editable) {
        onSelect?.(id);
        return;
      }

      clearResumeTimer();
      setManualMode(true);
      setActiveId(id);
      scheduleResumeAutoPlay(TAP_RESUME_DELAY_MS);
    },
    [clearResumeTimer, editable, onSelect, scheduleResumeAutoPlay]
  );

  const handleSvgClick = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      if (!editable || !onMapClick || !svgRef.current) return;

      const coords = screenToSvg(
        svgRef.current,
        event.clientX,
        event.clientY
      );
      onMapClick(coords.x, coords.y);
    },
    [editable, onMapClick]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGGElement>, id: string) => {
      if (!editable || !onMove || !svgRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      onSelect?.(id);
      setDraggingId(id);

      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!svgRef.current) return;
        const coords = screenToSvg(
          svgRef.current,
          moveEvent.clientX,
          moveEvent.clientY
        );
        onMove(id, coords.x, coords.y);
      };

      const handlePointerUp = () => {
        target.releasePointerCapture(event.pointerId);
        setDraggingId(null);
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
        target.removeEventListener("pointercancel", handlePointerUp);
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", handlePointerUp);
      target.addEventListener("pointercancel", handlePointerUp);
    },
    [editable, onMove, onSelect]
  );

  const activeLocation = locations.find((loc) => loc.id === highlightedId);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div
        ref={containerRef}
        className="relative mx-auto w-full"
        style={{ aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}` }}
      >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
        className={cn("h-full w-full", editable && "cursor-crosshair")}
        role="img"
        aria-label={mapAlt}
      >
        <rect
          x={0}
          y={0}
          width={MAP_VIEWBOX.width}
          height={MAP_VIEWBOX.height}
          fill="transparent"
          onClick={editable ? handleSvgClick : undefined}
        />
        <image
          href="/assets/world-map.svg"
          width={MAP_VIEWBOX.width}
          height={MAP_VIEWBOX.height}
          preserveAspectRatio="xMidYMid meet"
          pointerEvents="none"
        />

        {locations.map((location) => {
          const isActive = highlightedId === location.id;
          const isDragging = draggingId === location.id;
          const label = location.country;

          return (
            <g
              key={location.id}
              className={cn(
                editable ? "cursor-grab" : "cursor-pointer",
                isDragging && "cursor-grabbing"
              )}
              onMouseEnter={() => handleHoverStart(location.id)}
              onMouseLeave={handleHoverEnd}
              onClick={(event) => {
                event.stopPropagation();
                if (editable) {
                  onSelect?.(location.id);
                } else {
                  handleManualSelect(location.id);
                }
              }}
              onPointerDown={(event) => handlePointerDown(event, location.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (editable) {
                    onSelect?.(location.id);
                  } else {
                    handleManualSelect(location.id);
                  }
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={label}
              aria-expanded={isActive}
              aria-pressed={editable ? isActive : undefined}
            >
              <circle
                cx={location.x}
                cy={location.y}
                r={editable ? 16 : 14}
                fill="transparent"
                className="pointer-events-auto"
              />
              <circle
                cx={location.x}
                cy={location.y}
                r={isActive ? 6 : 5}
                stroke="#ffffff"
                strokeWidth={isActive ? 2 : 1.5}
                className={cn(
                  "pointer-events-none fill-oboya-green transition-all duration-300 ease-in-out",
                  isActive ? "opacity-100" : "opacity-70",
                  isActive && "drop-shadow-[0_0_6px_rgb(77_175_78/60%)]",
                  editable && isActive && "fill-oboya-blue-dark"
                )}
              />
              <circle
                cx={location.x}
                cy={location.y}
                r={isActive ? 9 : 7}
                className={cn(
                  "pointer-events-none fill-oboya-green/25 transition-all duration-300 ease-in-out",
                  isActive ? "opacity-100" : "opacity-0",
                  editable && isActive && "fill-oboya-blue-dark/25"
                )}
              />
            </g>
          );
        })}
      </svg>

      {locations.map((location) => {
        if (!location.flag) return null;

        const leftPercent = (location.x / MAP_VIEWBOX.width) * 100;
        const topPercent = (location.y / MAP_VIEWBOX.height) * 100;
        const isActive = highlightedId === location.id;

        return (
          <div
            key={`flag-${location.id}`}
            className={cn(
              "pointer-events-none absolute z-[1] aspect-[3/2] -translate-x-1/2 -translate-y-full overflow-hidden rounded-[2px] border border-white/90 leading-none shadow-sm transition-transform duration-200",
              isActive &&
                "z-[2] scale-110 shadow-md ring-2 ring-oboya-green/50",
              editable && isActive && "ring-oboya-blue-dark/50"
            )}
            style={{
              left: `${leftPercent}%`,
              top: `calc(${topPercent}% - ${flagOffset}px)`,
              width: `${flagWidth}px`,
            }}
            aria-hidden
          >
            <CountryFlag code={location.flag} className="h-full w-full" />
          </div>
        );
      })}

      {!editable && interactiveHint && (
        <div className="pointer-events-none absolute right-2 bottom-2 z-[3] flex items-center gap-1.5 rounded-full border border-border/50 bg-white/95 px-3 py-1.5 text-xs font-medium text-oboya-blue-dark shadow-sm backdrop-blur-sm">
          <Mouse
            className="size-3.5 shrink-0 text-oboya-green"
            aria-hidden
          />
          <span>{interactiveHint}</span>
        </div>
      )}
      </div>

      {!editable && activeLocation && (
        <MapLocationInfoPanel
          location={activeLocation}
          fadeDuration={prefersReducedMotion ? 0 : SELECTION_FADE_MS}
        />
      )}
    </div>
  );
}
