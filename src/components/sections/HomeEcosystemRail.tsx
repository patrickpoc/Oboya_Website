"use client";

import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type { EcoPhaseKind } from "@/components/sections/useEcosystemSequence";
import { STAGE_MS } from "@/components/sections/useEcosystemSequence";
import { cn } from "@/lib/utils";

/**
 * Step rail: stage-name buttons joined by one line, progress on the active one, Pause/Play.
 * Click / Enter / Space select a stage; hovering has no effect (and the rail sits outside the
 * stage's hover-pause area).
 */
export function HomeEcosystemRail({
  labels,
  kind,
  stageIndex,
  phase,
  playState,
  autoplay,
  isStatic,
  onSelect,
  onToggle,
}: {
  labels: string[];
  kind: EcoPhaseKind;
  stageIndex: number;
  phase: number;
  playState: "running" | "paused";
  autoplay: boolean;
  isStatic: boolean;
  onSelect: (i: number) => void;
  onToggle: () => void;
}) {
  const t = useTranslations("homeEcosystem");
  const afterStages = kind === "closing" || kind === "hold";
  const inStage = kind === "stage" || kind === "static";

  const activeLabel = inStage ? labels[stageIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Announces the active step only when the user is driving it (autoplay stays quiet). */}
      <p
        className="sr-only"
        aria-live={autoplay && !isStatic ? "off" : "polite"}
      >
        {activeLabel ?? ""}
      </p>
      {/* Small screens: dots on the rail, the active name reads here in full. */}
      <p
        className="flex min-h-5 items-center font-body text-sm font-light text-white sm:hidden"
        aria-hidden
      >
        {activeLabel}
      </p>
      <div className="flex items-end gap-4 md:gap-6">
        <ol className="flex min-w-0 flex-1 items-end gap-1">
          {labels.map((label, i) => {
            const isActive = inStage && i === stageIndex;
            const done = afterStages || (inStage && i < stageIndex);
            return (
              <li key={i} className="min-w-0 flex-1 sm:flex-auto">
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex min-h-11 w-full cursor-pointer flex-col justify-end gap-3 rounded-sm pt-1 text-left outline-none",
                    "focus-visible:ring-2 focus-visible:ring-oboya-green-light/70 focus-visible:ring-offset-2 focus-visible:ring-offset-oboya-blue-dark",
                  )}
                >
                  <span className="flex h-4 items-center gap-2.5 px-1">
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 shrink-0 rounded-full transition-colors duration-300",
                        isActive
                          ? "bg-oboya-green-light"
                          : done
                            ? "bg-white/60"
                            : "bg-white/25",
                      )}
                    />
                    <span
                      className={cn(
                        "sr-only font-body text-xs font-light leading-none whitespace-nowrap transition-colors duration-300 sm:not-sr-only lg:text-sm",
                        isActive
                          ? "text-white"
                          : "text-white/60",
                      )}
                    >
                      {label}
                    </span>
                  </span>
                  <span className="block h-px w-full overflow-hidden bg-white/15">
                    {done ? (
                      <span className="block h-full w-full bg-white/50" />
                    ) : null}
                    {isActive && !isStatic ? (
                      <span
                        key={phase}
                        className="block h-full w-full origin-left bg-oboya-green-light"
                        style={{
                          animation: `eco-fill ${STAGE_MS}ms linear forwards`,
                          animationPlayState: playState,
                        }}
                      />
                    ) : null}
                    {isActive && isStatic ? (
                      <span className="block h-full w-full bg-oboya-green-light" />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {!isStatic ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={autoplay ? t("pause") : t("play")}
            className={cn(
              "mb-[-0.25rem] flex size-11 shrink-0 items-center justify-center rounded-full text-white/80 ring-1 ring-white/20 transition-colors duration-300 outline-none",
              "hover:text-white hover:ring-white/50 focus-visible:ring-2 focus-visible:ring-oboya-green-light/70",
            )}
          >
            {autoplay ? (
              <Pause className="size-4" aria-hidden />
            ) : (
              <Play className="size-4 translate-x-px" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
