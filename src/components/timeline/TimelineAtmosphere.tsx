"use client";

/** Clean dark stage behind the raised timeline layout. */
export function TimelineAtmosphere() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-oboya-blue-dark" />
    </div>
  );
}
