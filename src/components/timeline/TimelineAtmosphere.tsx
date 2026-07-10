"use client";

export function TimelineAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-oboya-blue-dark" />

      <div className="timeline-blob timeline-blob-a absolute -top-[20%] left-[10%] size-[55vmax] rounded-full opacity-[0.14] blur-[100px]" />
      <div className="timeline-blob timeline-blob-b absolute top-[30%] -right-[15%] size-[50vmax] rounded-full opacity-[0.12] blur-[110px]" />
      <div className="timeline-blob timeline-blob-c absolute -bottom-[10%] left-[30%] size-[45vmax] rounded-full opacity-[0.1] blur-[90px]" />

      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
