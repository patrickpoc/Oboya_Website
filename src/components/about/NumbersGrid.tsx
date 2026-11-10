import {
  Building2,
  CalendarDays,
  Factory,
  Globe2,
  Handshake,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  AboutImpactStatIcon,
  AboutPageSettings,
} from "@/lib/cms/repositories/about-page-repository";
import { pickLocalized } from "@/lib/cms/utils";

type ImpactStat = AboutPageSettings["impact"]["stats"][number];

const ICON_MAP: Record<AboutImpactStatIcon, LucideIcon> = {
  globe: Globe2,
  factory: Factory,
  building: Building2,
  users: Users,
  handshake: Handshake,
  package: Package,
  calendar: CalendarDays,
};

const DARK_TEXT = "#01203F";

function channel(v: number) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

/** White text unless the dark brand blue contrasts better on this background. */
function textColorOn(bg: string) {
  const l = luminance(bg);
  const white = 1.05 / (l + 0.05);
  const dark = (l + 0.05) / (luminance(DARK_TEXT) + 0.05);
  return dark > white ? DARK_TEXT : "#ffffff";
}

export function NumbersGrid({
  stats,
  locale,
}: {
  stats: ImpactStat[];
  locale: string;
}) {
  if (stats.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {stats.map((stat) => {
        const label = pickLocalized(stat.label, locale);
        const Icon = ICON_MAP[stat.icon] ?? Globe2;
        const accent = stat.accentColor || "#4DAF4E";
        const color = textColorOn(accent);
        const value = stat.pending ? "XX" : `${stat.value}${stat.suffix}`;

        return (
          <li
            key={stat.id}
            className="relative flex min-h-52 flex-col items-center rounded-2xl px-5 py-5 md:min-h-56"
            style={{ backgroundColor: accent, color }}
          >
            <span
              aria-hidden
              className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm"
            >
              <Icon
                className="size-4"
                strokeWidth={1.6}
                style={{ color: textColorOn(accent) === "#ffffff" ? accent : DARK_TEXT }}
              />
            </span>
            <p className="px-10 pt-1.5 text-center font-body text-sm font-medium leading-snug md:text-[0.9375rem]">
              {label}
            </p>
            <p
              className="flex flex-1 items-center justify-center font-display text-[clamp(3rem,6vw,4.5rem)] font-semibold leading-none tracking-tight tabular-nums"
              aria-label={stat.pending ? `${label}: data pending` : undefined}
            >
              {value}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
