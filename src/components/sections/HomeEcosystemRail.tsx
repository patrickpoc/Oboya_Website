"use client";

import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type { EcoPhaseKind } from "@/components/sections/useEcosystemSequence";
import { STAGE_MS } from "@/components/sections/useEcosystemSequence";
import { cn } from "@/lib/utils";

/** Step rail: numbered stage buttons joined by one line, progress on the active one, Pause/Play. */
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
  const total = labels.length;
  const afterStages = kind === "closing" || kind === "hold";
  const inStage = kind === "stage" || kind === "static";

  const activeLabel = inStage ? labels[stageIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Small screens: numbers only on the rail, the active label reads here in full. */}
      <p
        className="flex min-h-5 items-center gap-3 font-body text-sm font-light text-white sm:hidden"
        aria-live="polite"
      >
        {activeLabel ? (
          <>
            <span className="text-[0.68rem] font-medium tabular-nums tracking-[0.18em] text-oboya-green-light">
              {String(stageIndex + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>
            <span>{activeLabel}</span>
          </>
        ) : null}
      </p>
      <div className="flex items-end gap-4 md:gap-6">
        <ol className="flex min-w-0 flex-1 gap-1" aria-label={t("ariaLabel")}>
          {labels.map((label, i) => {
            const isActive = inStage && i === stageIndex;
            const done = afterStages || (inStage && i < stageIndex);
            return (
              <li key={i} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={t("goToStage", { stage: label })}
                  className={cn(
                    "group flex min-h-11 w-full flex-col justify-end gap-3 rounded-sm pt-1 text-left outline-none",
                    "focus-visible:ring-2 focus-visible:ring-oboya-green-light/70 focus-visible:ring-offset-2 focus-visible:ring-offset-oboya-blue-dark",
                  )}
                >
                  <span className="flex items-center gap-2.5 px-1">
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 shrink-0 rounded-full transition-colors duration-300",
                        isActive
                          ? "bg-oboya-green-light"
                          : done
                            ? "bg-white/60"
                            : "bg-white/25 group-hover:bg-white/50",
                      )}
                    />
                    <span
                      className={cn(
                        "font-body text-[0.68rem] font-medium tabular-nums tracking-[0.18em] transition-colors duration-300",
                        isActive
                          ? "text-oboya-green-light"
                          : "text-white/45 group-hover:text-white/70",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "hidden min-w-0 font-body text-sm font-light leading-tight transition-colors duration-300 sm:block",
                        isActive
                          ? "text-white"
                          : "text-white/60 group-hover:text-white/85",
                      )}
                    >
                      {label}
                    </span>
                    <span className="sr-only">
                      {t("stepOf", { index: i + 1, total })}
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
            aria-pressed={!autoplay}
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
