"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapLocationInfoPanel } from "@/components/sections/MapLocationInfoPanel";
import { InteractiveWorldMap } from "@/components/sections/InteractiveWorldMap";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  countryFlagOptions,
  suggestFlagByCountryName,
} from "@/constants/country-flags";
import { localeLabels, locales, type Locale } from "@/i18n/routing";
import {
  createEmptyLocation,
  createEmptyOffice,
  MAP_COUNTRY_FIELDS,
  MAP_OFFICE_FIELDS,
  normalizeMapLocations,
  resolveMapLocationsForLocale,
  type MapLocation,
  type MapLocationsData,
  type MapOffice,
} from "@/lib/map-locations";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type SaveState = "idle" | "saving" | "saved" | "error";

export function MapLocationEditor() {
  const [data, setData] = useState<MapLocationsData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>("en");
  const [previewLocale, setPreviewLocale] = useState<Locale>("en");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/map-locations");
        if (!response.ok) {
          throw new Error("Failed to load map locations");
        }
        const json = normalizeMapLocations(await response.json());
        if (!cancelled) {
          setData(json);
          const first = json.locations[0];
          setSelectedId(first?.id ?? null);
          setSelectedOfficeId(first?.offices[0]?.id ?? null);
        }
      } catch (loadErr) {
        if (!cancelled) {
          setLoadError(
            loadErr instanceof Error ? loadErr.message : "Failed to load"
          );
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedLocation = useMemo(
    () => data?.locations.find((location) => location.id === selectedId) ?? null,
    [data, selectedId]
  );

  const selectedOffice = useMemo(
    () =>
      selectedLocation?.offices.find((office) => office.id === selectedOfficeId) ??
      selectedLocation?.offices[0] ??
      null,
    [selectedLocation, selectedOfficeId]
  );

  useEffect(() => {
    if (!selectedLocation) {
      setSelectedOfficeId(null);
      return;
    }

    if (
      !selectedOfficeId ||
      !selectedLocation.offices.some((office) => office.id === selectedOfficeId)
    ) {
      setSelectedOfficeId(selectedLocation.offices[0]?.id ?? null);
    }
  }, [selectedLocation, selectedOfficeId]);

  const previewLocations = useMemo(
    () =>
      data ? resolveMapLocationsForLocale(data.locations, previewLocale) : [],
    [data, previewLocale]
  );

  const previewLocation = useMemo(
    () => previewLocations.find((location) => location.id === selectedId) ?? null,
    [previewLocations, selectedId]
  );

  const updateLocation = useCallback(
    (id: string, updater: (location: MapLocation) => MapLocation) => {
      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          locations: current.locations.map((location) =>
            location.id === id ? updater(location) : location
          ),
        };
      });
      setSaveState("idle");
    },
    []
  );

  const updateOffice = useCallback(
    (
      locationId: string,
      officeId: string,
      updater: (office: MapOffice) => MapOffice
    ) => {
      updateLocation(locationId, (location) => ({
        ...location,
        offices: location.offices.map((office) =>
          office.id === officeId ? updater(office) : office
        ),
      }));
    },
    [updateLocation]
  );

  const handleAddLocation = useCallback(() => {
    if (!data) return;

    const location = createEmptyLocation(data.locations.map((item) => item.id));
    setData({
      ...data,
      locations: [...data.locations, location],
    });
    setSelectedId(location.id);
    setSelectedOfficeId(location.offices[0]?.id ?? null);
    setSaveState("idle");
  }, [data]);

  const handleAddOffice = useCallback(() => {
    if (!selectedLocation) return;

    const office = createEmptyOffice(
      selectedLocation.id,
      selectedLocation.offices.map((item) => item.id)
    );

    updateLocation(selectedLocation.id, (location) => ({
      ...location,
      offices: [...location.offices, office],
    }));
    setSelectedOfficeId(office.id);
  }, [selectedLocation, updateLocation]);

  const handleDeleteOffice = useCallback(() => {
    if (!selectedLocation || !selectedOffice || selectedLocation.offices.length <= 1) {
      return;
    }

    const nextOffices = selectedLocation.offices.filter(
      (office) => office.id !== selectedOffice.id
    );

    updateLocation(selectedLocation.id, (location) => ({
      ...location,
      offices: nextOffices,
    }));
    setSelectedOfficeId(nextOffices[0]?.id ?? null);
  }, [selectedLocation, selectedOffice, updateLocation]);

  const handleMapClick = useCallback(
    (x: number, y: number) => {
      if (!data) return;

      const location = createEmptyLocation(data.locations.map((item) => item.id));
      location.x = x;
      location.y = y;

      setData({
        ...data,
        locations: [...data.locations, location],
      });
      setSelectedId(location.id);
      setSelectedOfficeId(location.offices[0]?.id ?? null);
      setSaveState("idle");
    },
    [data]
  );

  const handleMove = useCallback(
    (id: string, x: number, y: number) => {
      updateLocation(id, (location) => ({ ...location, x, y }));
    },
    [updateLocation]
  );

  const handleDelete = useCallback(() => {
    if (!data || !selectedId) return;

    const nextLocations = data.locations.filter(
      (location) => location.id !== selectedId
    );
    setData({ ...data, locations: nextLocations });
    const next = nextLocations[0] ?? null;
    setSelectedId(next?.id ?? null);
    setSelectedOfficeId(next?.offices[0]?.id ?? null);
    setSaveState("idle");
  }, [data, selectedId]);

  const handleSave = useCallback(async () => {
    if (!data) return;

    setSaveState("saving");
    setError(null);

    try {
      const response = await fetch("/api/map-locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        errors?: string[];
        error?: string;
      };

      if (!response.ok) {
        const message =
          result.errors?.join(", ") ?? result.error ?? "Failed to save";
        throw new Error(message);
      }

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (saveErr) {
      setSaveState("error");
      setError(saveErr instanceof Error ? saveErr.message : "Failed to save");
    }
  }, [data]);

  const handleLogout = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }, []);

  if (loadError) {
    return (
      <Container className="py-12">
        <p className="text-destructive">{loadError}</p>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container className="py-12">
        <p className="text-muted-foreground">Loading map locations…</p>
      </Container>
    );
  }

  const countryTranslation = selectedLocation?.translations[activeLocale];
  const officeTranslation = selectedOffice?.translations[activeLocale];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <Container size="wide">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-oboya-blue-dark">
              Map locations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag markers to reposition. Click the map to add a location. Each
              country can have multiple offices or factories.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isSupabaseConfigured && (
              <Button type="button" variant="ghost" onClick={() => void handleLogout()}>
                Sign out
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleAddLocation}>
              Add location
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saveState === "saving"}
            >
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved"
                  : "Save changes"}
            </Button>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-oboya-blue-dark">
                  Interactive map
                </p>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Preview locale
                  <select
                    value={previewLocale}
                    onChange={(event) =>
                      setPreviewLocale(event.target.value as Locale)
                    }
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                  >
                    {locales.map((locale) => (
                      <option key={locale} value={locale}>
                        {localeLabels[locale]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <InteractiveWorldMap
                locations={previewLocations}
                mapAlt="Admin map editor"
                editable
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={handleMove}
                onMapClick={handleMapClick}
              />
            </div>

            {previewLocation && (
              <div>
                <p className="mb-2 text-sm font-medium text-oboya-blue-dark">
                  Panel preview
                </p>
                <MapLocationInfoPanel
                  location={previewLocation}
                  fadeDuration={0}
                />
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-border/60 bg-white p-5 shadow-[var(--shadow-card)]">
            {selectedLocation && countryTranslation && selectedOffice && officeTranslation ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-oboya-blue-dark">
                    Edit location
                  </h2>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={cn(
                      buttonVariants({ variant: "destructive", size: "sm" })
                    )}
                  >
                    Delete
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
                  {locales.map((locale) => (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => setActiveLocale(locale)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        activeLocale === locale
                          ? "bg-white text-oboya-blue-dark shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {localeLabels[locale]}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <Field label="ID">
                    <input
                      type="text"
                      value={selectedLocation.id}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        const existingIds = data.locations
                          .filter((item) => item.id !== selectedLocation.id)
                          .map((item) => item.id);

                        if (existingIds.includes(nextId)) return;

                        setData((current) => {
                          if (!current) return current;
                          return {
                            ...current,
                            locations: current.locations.map((location) =>
                              location.id === selectedLocation.id
                                ? { ...location, id: nextId }
                                : location
                            ),
                          };
                        });
                        setSelectedId(nextId);
                        setSaveState("idle");
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </Field>

                  <Field label="Flag">
                    <div className="space-y-2">
                      {selectedLocation.flag && (
                        <div className="aspect-[3/2] w-14 overflow-hidden rounded-lg border border-border bg-muted/40 leading-none">
                          <CountryFlag
                            code={selectedLocation.flag}
                            className="size-full"
                          />
                        </div>
                      )}
                      <div className="grid max-h-40 grid-cols-5 gap-2 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-6">
                        <button
                          type="button"
                          title="No flag"
                          onClick={() =>
                            updateLocation(selectedLocation.id, (location) => ({
                              ...location,
                              flag: "",
                            }))
                          }
                          className={cn(
                            "rounded-md border px-1 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted",
                            !selectedLocation.flag &&
                              "border-oboya-green bg-oboya-green/10"
                          )}
                        >
                          —
                        </button>
                        {countryFlagOptions.map((option) => (
                          <button
                            key={option.code}
                            type="button"
                            title={option.label}
                            onClick={() =>
                              updateLocation(selectedLocation.id, (location) => ({
                                ...location,
                                flag: option.code,
                              }))
                            }
                            className={cn(
                              "aspect-[3/2] w-full overflow-hidden rounded-md border p-0 leading-none transition-colors hover:bg-muted",
                              selectedLocation.flag === option.code &&
                                "border-oboya-green bg-oboya-green/10"
                            )}
                          >
                            <CountryFlag
                              code={option.code}
                              className="size-full"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </Field>

                  {MAP_COUNTRY_FIELDS.map((field) => (
                    <Field key={field.key} label={field.adminLabel}>
                      <input
                        type="text"
                        value={countryTranslation[field.key]}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateLocation(selectedLocation.id, (location) => {
                            const next = {
                              ...location,
                              translations: {
                                ...location.translations,
                                [activeLocale]: {
                                  ...location.translations[activeLocale],
                                  [field.key]: value,
                                },
                              },
                            };

                            if (
                              field.key === "country" &&
                              activeLocale === "en" &&
                              !location.flag &&
                              value.trim()
                            ) {
                              next.flag = suggestFlagByCountryName(value);
                            }

                            return next;
                          });
                        }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </Field>
                  ))}

                  <div className="border-t border-border/60 pt-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-oboya-blue-dark">
                        Offices / factories
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddOffice}
                      >
                        Add office
                      </Button>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-1">
                      {selectedLocation.offices.map((office, index) => {
                        const label =
                          office.translations[activeLocale].city ||
                          office.translations[activeLocale].operationType ||
                          office.translations.en.city ||
                          `Office ${index + 1}`;

                        return (
                          <button
                            key={office.id}
                            type="button"
                            onClick={() => setSelectedOfficeId(office.id)}
                            className={cn(
                              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                              selectedOffice.id === office.id
                                ? "border-oboya-green bg-oboya-green/10 text-oboya-blue-dark"
                                : "border-border text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Editing office
                        </p>
                        {selectedLocation.offices.length > 1 && (
                          <button
                            type="button"
                            onClick={handleDeleteOffice}
                            className={cn(
                              buttonVariants({ variant: "destructive", size: "sm" })
                            )}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <Field label="Office ID">
                        <input
                          type="text"
                          value={selectedOffice.id}
                          onChange={(event) => {
                            const nextId = event.target.value;
                            const existingIds = selectedLocation.offices
                              .filter((item) => item.id !== selectedOffice.id)
                              .map((item) => item.id);

                            if (existingIds.includes(nextId)) return;

                            updateOffice(
                              selectedLocation.id,
                              selectedOffice.id,
                              (office) => ({ ...office, id: nextId })
                            );
                            setSelectedOfficeId(nextId);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </Field>

                      <Field label="Email">
                        <input
                          type="email"
                          value={selectedOffice.email}
                          onChange={(event) =>
                            updateOffice(
                              selectedLocation.id,
                              selectedOffice.id,
                              (office) => ({
                                ...office,
                                email: event.target.value,
                              })
                            )
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </Field>

                      {MAP_OFFICE_FIELDS.map((field) => (
                        <Field key={field.key} label={field.adminLabel}>
                          {field.input === "textarea" ? (
                            <textarea
                              value={officeTranslation[field.key]}
                              onChange={(event) =>
                                updateOffice(
                                  selectedLocation.id,
                                  selectedOffice.id,
                                  (office) => ({
                                    ...office,
                                    translations: {
                                      ...office.translations,
                                      [activeLocale]: {
                                        ...office.translations[activeLocale],
                                        [field.key]: event.target.value,
                                      },
                                    },
                                  })
                                )
                              }
                              rows={3}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                          ) : (
                            <input
                              type="text"
                              value={officeTranslation[field.key]}
                              onChange={(event) =>
                                updateOffice(
                                  selectedLocation.id,
                                  selectedOffice.id,
                                  (office) => ({
                                    ...office,
                                    translations: {
                                      ...office.translations,
                                      [activeLocale]: {
                                        ...office.translations[activeLocale],
                                        [field.key]: event.target.value,
                                      },
                                    },
                                  })
                                )
                              }
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                          )}
                        </Field>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    Position: {selectedLocation.x.toFixed(1)},{" "}
                    {selectedLocation.y.toFixed(1)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold text-oboya-blue-dark">
                  No location selected
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select a marker on the map or click the map to add a new
                  location.
                </p>
                <Button type="button" onClick={handleAddLocation}>
                  Add location
                </Button>
              </div>
            )}

            <div className="mt-8 border-t border-border/60 pt-5">
              <p className="mb-3 text-sm font-medium text-oboya-blue-dark">
                All locations ({data.locations.length})
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {data.locations.map((location) => {
                  const label =
                    location.translations[previewLocale].country ||
                    location.id;
                  const officeCount = location.offices.length;

                  return (
                    <li key={location.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(location.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          selectedId === location.id
                            ? "bg-oboya-green/10 text-oboya-blue-dark"
                            : "hover:bg-muted"
                        )}
                      >
                        {location.flag && (
                          <span
                            className="inline-flex aspect-[3/2] h-4 shrink-0 overflow-hidden rounded-[2px] border border-border/40 leading-none"
                            aria-hidden
                          >
                            <CountryFlag
                              code={location.flag}
                              className="h-full w-full"
                            />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {officeCount > 1 && (
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {officeCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
