"use client";

import { useEffect, useState } from "react";
import type { MapLocationsData } from "@/lib/map-locations";
import { normalizeMapLocations } from "@/lib/map-locations";
import staticMapData from "@/../data/map-locations.json";

let cachedMapData: MapLocationsData | null = null;

export function useMapLocations() {
  const [data, setData] = useState<MapLocationsData | null>(cachedMapData);
  const [loading, setLoading] = useState(!cachedMapData);

  useEffect(() => {
    if (cachedMapData) return;

    fetch("/api/map-locations")
      .then((res) => res.json())
      .then((json) => {
        cachedMapData = normalizeMapLocations(json);
        setData(cachedMapData);
      })
      .catch(() => {
        cachedMapData = normalizeMapLocations(staticMapData);
        setData(cachedMapData);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
