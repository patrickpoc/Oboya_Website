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
        const value = stat.pending ? "XX" : `${stat.value}${stat.suffix}`;

        return (
          <li
            key={stat.id}
            className="relative flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl bg-oboya-soft-white px-5 py-8 text-oboya-green md:min-h-56"
          >
            <span
              aria-hidden
              className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white shadow-sm"
            >
              <Icon className="size-4 text-oboya-green" strokeWidth={1.6} />
            </span>
            {/* Big number first, label below. */}
            <p
              className="font-display text-[clamp(3rem,6vw,4.5rem)] font-semibold leading-none tracking-tight tabular-nums"
              aria-label={stat.pending ? `${label}: data pending` : undefined}
            >
              {value}
            </p>
            <p className="px-6 text-center font-body text-base font-medium leading-tight text-oboya-blue-dark md:text-lg">
              {label}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
