import { MAP_VIEWBOX, type MapConnection } from "@/lib/map-locations";

export const MAP_CONNECTION_STYLE = {
  stroke: "#4DAF4E",
  strokeWidth: 1.35,
  glowStrokeWidth: 4,
  glowOpacity: 0.35,
  opacity: 0.85,
  arrowSize: 5,
} as const;

export const VISIBLE_CONNECTION_COUNT = 5;

/** Full draw → hold → erase cycle duration (ms). */
export const CONNECTION_CYCLE_DURATION_MS = 2800;

/**
 * Evenly spaces slot start times across one full cycle so lines never
 * launch together. Slot 0 starts immediately; later slots stay permanently
 * phase-shifted because each cycle has the same duration.
 */
export function getConnectionPhaseDelayMs(
  slotIndex: number,
  total: number = VISIBLE_CONNECTION_COUNT
): number {
  if (total <= 1) return 0;
  return Math.round((CONNECTION_CYCLE_DURATION_MS / total) * slotIndex);
}

/** Small pause before a slot restarts, keeps phases from locking over time. */
export function getConnectionRestartJitterMs(): number {
  return 180 + Math.floor(Math.random() * 420);
}

type Point = { x: number; y: number };

export type LocationLike = {
  id: string;
  x: number;
  y: number;
  hasFactories?: boolean;
  sendOnly?: boolean;
};

export type ConnectionSlot = {
  slotId: number;
  from: string;
  to: string;
  /** Bumps to remount/restart the path animation. */
  cycle: number;
};

export function connectionPairKey(from: string, to: string): string {
  return from < to ? `${from}-${to}` : `${to}-${from}`;
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

export function getFactoryHubs(locations: LocationLike[]): LocationLike[] {
  const hubs = locations.filter((location) => location.hasFactories);
  if (hubs.length > 0) return hubs;

  // Legacy / remote data without the flag — keep map arrows visible.
  const fallbackIds = new Set(["brazil", "china", "colombia"]);
  return locations.filter((location) => fallbackIds.has(location.id));
}

/**
 * Directed connections: every factory hub → every other country that
 * accepts incoming arrows (`sendOnly` locations are origins only).
 */
export function generateFactoryConnections(
  locations: LocationLike[]
): MapConnection[] {
  const hubs = getFactoryHubs(locations);
  if (hubs.length === 0) return [];

  const pairs: MapConnection[] = [];
  for (const hub of hubs) {
    for (const target of locations) {
      if (hub.id === target.id) continue;
      if (target.sendOnly) continue;
      pairs.push({ from: hub.id, to: target.id });
    }
  }
  return pairs;
}

function resolvePool(
  locations: LocationLike[],
  connections?: MapConnection[]
): MapConnection[] {
  if (connections?.length) {
    const ids = new Set(locations.map((location) => location.id));
    const hubs = new Set(getFactoryHubs(locations).map((hub) => hub.id));
    const sendOnlyIds = new Set(
      locations.filter((location) => location.sendOnly).map((location) => location.id)
    );
    return connections.filter(
      (connection) =>
        ids.has(connection.from) &&
        ids.has(connection.to) &&
        !sendOnlyIds.has(connection.to) &&
        (hubs.size === 0 || hubs.has(connection.from))
    );
  }
  return generateFactoryConnections(locations);
}

/**
 * Seed up to `count` hub→destination connections, rotating hubs and
 * preferring distinct destinations so lines don't all leave the same country.
 */
export function seedDiverseConnections(
  locations: LocationLike[],
  count: number = VISIBLE_CONNECTION_COUNT,
  connections?: MapConnection[]
): MapConnection[] {
  if (locations.length < 2) return [];

  const pool = shuffleInPlace([...resolvePool(locations, connections)]);
  if (pool.length === 0) return [];

  const hubs = getFactoryHubs(locations);
  const selected: MapConnection[] = [];
  const usedDestinations = new Set<string>();

  // Round-robin across hubs first for visual variety.
  if (hubs.length > 0) {
    const byHub = new Map<string, MapConnection[]>();
    for (const connection of pool) {
      const list = byHub.get(connection.from) ?? [];
      list.push(connection);
      byHub.set(connection.from, list);
    }

    let guard = 0;
    while (selected.length < count && guard < count * hubs.length * 3) {
      const hub = hubs[guard % hubs.length];
      const candidates = byHub.get(hub.id) ?? [];
      const next = candidates.find(
        (connection) => !usedDestinations.has(connection.to)
      );
      if (next) {
        selected.push(next);
        usedDestinations.add(next.to);
        byHub.set(
          hub.id,
          candidates.filter((connection) => connection !== next)
        );
      }
      guard += 1;
      if (guard > count * hubs.length && selected.length === 0) break;
    }
  }

  for (const candidate of pool) {
    if (selected.length >= count) break;
    if (usedDestinations.has(candidate.to)) continue;
    if (
      selected.some(
        (item) =>
          connectionPairKey(item.from, item.to) ===
          connectionPairKey(candidate.from, candidate.to)
      )
    ) {
      continue;
    }
    selected.push(candidate);
    usedDestinations.add(candidate.to);
  }

  return selected.slice(0, count);
}

/**
 * Pick the next hub → destination after a line finishes.
 * Always originates from a factory hub; destinations may include other hubs.
 */
export function pickNextConnection(
  locations: LocationLike[],
  options: {
    occupiedDestinations: Set<string>;
    avoidPairKey?: string;
    preferHubId?: string;
    connections?: MapConnection[];
  }
): MapConnection | null {
  if (locations.length < 2) return null;

  const pool = resolvePool(locations, options.connections);
  if (pool.length === 0) return null;

  const hubs = getFactoryHubs(locations);
  const hubIds = hubs.map((hub) => hub.id);

  const score = (connection: MapConnection): number => {
    const key = connectionPairKey(connection.from, connection.to);
    if (options.avoidPairKey && key === options.avoidPairKey) return -1;

    let value = 10;
    if (options.preferHubId && connection.from === options.preferHubId) {
      value += 20;
    }
    if (!options.occupiedDestinations.has(connection.to)) value += 40;
    if (hubIds.includes(connection.from)) value += 15;
    return value;
  };

  const ranked = shuffleInPlace([...pool])
    .map((connection) => ({ connection, value: score(connection) }))
    .filter((item) => item.value >= 0)
    .sort((a, b) => b.value - a.value);

  if (ranked.length > 0) {
    const bestScore = ranked[0].value;
    const top = ranked.filter((item) => item.value === bestScore);
    return top[Math.floor(Math.random() * top.length)].connection;
  }

  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function createCurvedPath(
  start: Point,
  end: Point,
  viewBox: { width: number; height: number } = MAP_VIEWBOX
): string {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const offset = Math.min(viewBox.height * 0.12, len * 0.25);
  const cx = midX - (dy / len) * offset;
  const cy = midY + (dx / len) * offset;

  return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
}

export function resolveConnectionPath(
  connection: MapConnection,
  locations: LocationLike[],
  viewBox: { width: number; height: number } = MAP_VIEWBOX
): string | null {
  const byId = new Map(locations.map((location) => [location.id, location]));
  const from = byId.get(connection.from);
  const to = byId.get(connection.to);
  if (!from || !to) return null;
  return createCurvedPath(from, to, viewBox);
}
