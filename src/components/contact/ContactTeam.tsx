"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  CONTACT_REGION_IDS as CONTACT_REGIONS,
  type ContactPerson,
} from "@/lib/cms/repositories/contact-team-repository";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ContactTeam({ team }: { team: ContactPerson[] }) {
  const t = useTranslations("contact.team");
  const regions = useMemo(
    () => CONTACT_REGIONS.filter((r) => team.some((p) => p.region === r)),
    [team]
  );
  const [selected, setSelected] = useState<string>("");
  const active = regions.find((r) => r === selected) ?? regions[0];

  if (!regions.length) return null;

  const people = team.filter((p) => p.region === active);

  return (
    <section className="pb-20 pt-14 md:pb-28" aria-labelledby="contact-team-title">
      <Container>
        <h2 id="contact-team-title" className="sr-only">
          {t("title")}
        </h2>
        <div role="group" aria-label={t("title")} className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <button
              key={region}
              type="button"
              aria-pressed={region === active}
              onClick={() => setSelected(region)}
              className={cn(
                "min-h-10 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue-light",
                region === active
                  ? "bg-oboya-blue text-white"
                  : "bg-oboya-soft-white text-oboya-blue-dark hover:bg-oboya-blue/10"
              )}
            >
              {t(`regions.${region}`)}
            </button>
          ))}
        </div>
        <hr className="my-6 border-oboya-blue-dark/10" />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex flex-col items-center gap-3 rounded-lg bg-white p-6 text-center shadow-[var(--shadow-card)]"
            >
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-oboya-soft-white">
                {person.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="text-2xl font-semibold text-oboya-green"
                  >
                    {initials(person.name)}
                  </span>
                )}
              </div>
              <span className="block h-4 w-6 overflow-hidden rounded-[2px]">
                <CountryFlag code={person.countryCode} />
              </span>
              <p className="font-bold text-oboya-green">{person.name}</p>
              <a
                href={`mailto:${person.email}`}
                className="break-all text-sm text-oboya-blue-dark hover:underline"
              >
                {person.email}
              </a>
              {person.phone && (
                <a
                  href={`tel:${person.phone.replace(/[^\d+]/g, "")}`}
                  className="text-sm font-bold text-oboya-blue-dark hover:underline"
                >
                  {person.phone}
                </a>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
