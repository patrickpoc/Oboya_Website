"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAP_VIEWBOX,
  type MapConnection,
  type ResolvedMapLocation,
} from "@/lib/map-locations";
import {
  connectionPairKey,
  getConnectionPhaseDelayMs,
  getConnectionRestartJitterMs,
  type ConnectionSlot,
  pickNextConnection,
  resolveConnectionPath,
  seedDiverseConnections,
  VISIBLE_CONNECTION_COUNT,
} from "@/lib/map-connections";
import { AnimatedMapConnection } from "@/components/sections/AnimatedMapConnection";
import { MapLocationInfoPanel } from "@/components/sections/MapLocationInfoPanel";
import { CountryFlag } from "@/components/ui/country-flag";
import { screenToSvg } from "@/lib/svg-coords";
import { cn } from "@/lib/utils";

const AUTO_CYCLE_INTERVAL_MS = 7000;
/** Keep the same info card briefly after deselect before advancing the cycle. */
const DESELECT_HOLD_MS = 900;
const SELECTION_FADE_MS = 350;
const FLAG_WIDTH_RATIO = 0.044;
const FLAG_OFFSET_RATIO = 0.022;
const FLAG_MIN_WIDTH_PX = 14;
const FLAG_MAX_WIDTH_PX = 28;

export interface InteractiveWorldMapProps {
  locations: ResolvedMapLocation[];
  mapAlt: string;
  connections?: MapConnection[];
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onMapClick?: (x: number, y: number) => void;
}

export function InteractiveWorldMap({
  locations,
  mapAlt,
  connections,
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
  /** Click pins the country until unlocked (second click / background). */
  const [selectionLocked, setSelectionLocked] = useState(false);
  /** After deselect, keep the card but shrink the flag until the next cycle step. */
  const [suppressFlagEmphasis, setSuppressFlagEmphasis] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [connectionSlots, setConnectionSlots] = useState<ConnectionSlot[]>([]);
  const [connectionDelays, setConnectionDelays] = useState<Record<number, number>>(
    {}
  );
  const locationsRef = useRef(locations);
  locationsRef.current = locations;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const highlightedId = editable ? selectedId : activeId;
  const autoPlayEnabled =
    !editable && !manualMode && !prefersReducedMotion && !isTouch;
  /** Connection draw/erase runs independently of country hover/auto-cycle. */
  const connectionAnimationEnabled = !editable && !prefersReducedMotion;

  const locationIdsKey = useMemo(
    () => locations.map((location) => location.id).join(","),
    [locations]
  );

  const connectionsKey = useMemo(
    () =>
      connections?.map((connection) => `${connection.from}:${connection.to}`).join("|") ??
      "",
    [connections]
  );

  const factoriesKey = useMemo(
    () =>
      locations
        .map(
          (location) =>
            `${location.id}:${location.hasFactories ? 1 : 0}:${location.sendOnly ? 1 : 0}`
        )
        .join(","),
    [locations]
  );

  useEffect(() => {
    const currentLocations = locationsRef.current;

    if (currentLocations.length < 2) {
      setConnectionSlots([]);
      setConnectionDelays({});
      return;
    }

    const seeded = seedDiverseConnections(
      currentLocations,
      VISIBLE_CONNECTION_COUNT,
      connections
    );

    const slots: ConnectionSlot[] = seeded.map((connection, index) => ({
      slotId: index,
      from: connection.from,
      to: connection.to,
      cycle: 0,
    }));

    setConnectionSlots(slots);
    setConnectionDelays(
      Object.fromEntries(
        slots.map((slot) => [
          slot.slotId,
          getConnectionPhaseDelayMs(slot.slotId, slots.length),
        ])
      )
    );
  }, [locationIdsKey, connectionsKey, connections, factoriesKey]);

  const handleConnectionCycleComplete = useCallback(
    (slotId: number) => {
      setConnectionSlots((current) => {
        const slot = current.find((item) => item.slotId === slotId);
        if (!slot) return current;

        const occupiedDestinations = new Set<string>();
        for (const item of current) {
          if (item.slotId === slotId) continue;
          occupiedDestinations.add(item.to);
        }

        const next = pickNextConnection(locationsRef.current, {
          occupiedDestinations,
          avoidPairKey: connectionPairKey(slot.from, slot.to),
          preferHubId: slot.from,
          connections,
        });

        if (!next) return current;

        return current.map((item) =>
          item.slotId === slotId
            ? {
                ...item,
                from: next.from,
                to: next.to,
                cycle: item.cycle + 1,
              }
            : item
        );
      });

      // Keep phases desynced with a short organic pause — never restart all at 0.
      setConnectionDelays((current) => ({
        ...current,
        [slotId]: getConnectionRestartJitterMs(),
      }));
    },
    [connections]
  );

  const renderedConnections = useMemo(() => {
    return connectionSlots.flatMap((slot) => {
      const pathD = resolveConnectionPath(
        { from: slot.from, to: slot.to },
        locations,
        MAP_VIEWBOX
      );
      if (!pathD) return [];
      return [
        {
          ...slot,
          pathD,
          delayMs: connectionDelays[slot.slotId] ?? 0,
        },
      ];
    });
  }, [connectionSlots, connectionDelays, locations]);

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

  const unlockSelection = useCallback(() => {
    clearResumeTimer();
    // Contract the flag now, but keep the same country on the info card briefly.
    setSelectionLocked(false);
    setSuppressFlagEmphasis(true);
    setManualMode(true);

    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      const list = locationsRef.current;
      if (list.length > 0) {
        const currentIndex = list.findIndex(
          (location) => location.id === activeIdRef.current
        );
        const nextIndex =
          currentIndex < 0 ? 0 : (currentIndex + 1) % list.length;
        setActiveId(list[nextIndex]!.id);
      }
      setSuppressFlagEmphasis(false);
      setManualMode(false);
    }, DESELECT_HOLD_MS);
  }, [clearResumeTimer]);

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  useEffect(() => {
    if (locations.length === 0) return;
    if (activeIdRef.current) return;
    setActiveId(locations[0]!.id);
  }, [locations]);

  useEffect(() => {
    if (!autoPlayEnabled || locations.length === 0) return;

    let index = locations.findIndex(
      (location) => location.id === activeIdRef.current
    );
    if (index < 0) index = 0;
    setActiveId(locations[index]!.id);

    const interval = window.setInterval(() => {
      index = (index + 1) % locations.length;
      setActiveId(locations[index]!.id);
    }, AUTO_CYCLE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [autoPlayEnabled, locations]);

  const handleManualSelect = useCallback(
    (id: string) => {
      if (editable) {
        onSelect?.(id);
        return;
      }

      clearResumeTimer();

      // Second click on the same pin → shrink flag, keep card, then advance.
      if (selectionLocked && activeId === id) {
        unlockSelection();
        return;
      }

      setSelectionLocked(true);
      setSuppressFlagEmphasis(false);
      setManualMode(true);
      setActiveId(id);
    },
    [
      activeId,
      clearResumeTimer,
      editable,
      onSelect,
      selectionLocked,
      unlockSelection,
    ]
  );

  const handleBackgroundClick = useCallback(() => {
    if (editable) return;
    if (!selectionLocked) return;
    unlockSelection();
  }, [editable, selectionLocked, unlockSelection]);

  const handleSvgClick = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      if (editable) {
        if (!onMapClick || !svgRef.current) return;
        const coords = screenToSvg(
          svgRef.current,
          event.clientX,
          event.clientY
        );
        onMapClick(coords.x, coords.y);
        return;
      }
      handleBackgroundClick();
    },
    [editable, handleBackgroundClick, onMapClick]
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

  const activeLocation =
    locations.find((loc) => loc.id === highlightedId) ?? locations[0] ?? null;

  return (
    <div className="flex flex-col gap-2 md:gap-3">
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
          onClick={handleSvgClick}
        />
        <image
          href="/assets/world-map.svg"
          width={MAP_VIEWBOX.width}
          height={MAP_VIEWBOX.height}
          preserveAspectRatio="xMidYMid meet"
          pointerEvents="none"
        />

        {renderedConnections.length > 0 && (
          <g className="map-connections" pointerEvents="none" aria-hidden>
            {renderedConnections.map((connection) => (
              <AnimatedMapConnection
                key={`${connection.slotId}-${connection.cycle}-${connection.from}-${connection.to}`}
                pathD={connection.pathD}
                animate={connectionAnimationEnabled}
                delayMs={
                  connectionAnimationEnabled ? connection.delayMs : 0
                }
                onCycleComplete={
                  connectionAnimationEnabled
                    ? () => handleConnectionCycleComplete(connection.slotId)
                    : undefined
                }
              />
            ))}
          </g>
        )}

        {locations.map((location) => {
          const isActive = highlightedId === location.id;
          const isDragging = draggingId === location.id;
          const label = location.country;

          return (
            <g
              key={location.id}
              className={cn(
                "outline-none focus:outline-none focus-visible:outline-none",
                editable ? "cursor-grab" : "cursor-pointer",
                isDragging && "cursor-grabbing"
              )}
              style={{ outline: "none" }}
              onMouseDown={(event) => {
                // Prevent browser focus ring ("selection box") on click.
                if (!editable) event.preventDefault();
              }}
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
              aria-pressed={isActive}
            >
              <circle
                cx={location.x}
                cy={location.y}
                r={editable ? 22 : 20}
                fill="transparent"
                className="pointer-events-auto touch-manipulation"
              />
              <circle
                cx={location.x}
                cy={location.y}
                r={5}
                stroke="#ffffff"
                strokeWidth={1.5}
                className={cn(
                  "pointer-events-none fill-oboya-green transition-opacity duration-300 ease-in-out",
                  isActive ? "opacity-100" : "opacity-70",
                  editable && isActive && "fill-oboya-blue-dark"
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
        const isEmphasized =
          highlightedId === location.id && !suppressFlagEmphasis;

        return (
          <div
            key={`flag-${location.id}`}
            className={cn(
              "pointer-events-none absolute z-[1] aspect-[3/2] -translate-x-1/2 -translate-y-full overflow-hidden rounded-[2px] border border-white/90 leading-none shadow-sm transition-transform duration-200 ease-out",
              isEmphasized && "z-[2] scale-[1.35]"
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
      </div>

      {!editable && (
        <div className="relative mx-auto h-[9.75rem] w-full max-w-3xl md:h-[10.25rem] md:max-w-4xl">
          {activeLocation ? (
            <MapLocationInfoPanel
              location={activeLocation}
              fadeDuration={prefersReducedMotion ? 0 : SELECTION_FADE_MS}
              className="absolute inset-x-0 top-0 max-h-full w-full overflow-x-auto overflow-y-hidden"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
