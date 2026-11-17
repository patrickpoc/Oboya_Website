"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/admin/media/ImageField";
import {
  HOME_CHALLENGES_MAX_POINTS,
  type HomepageChallengePoint,
} from "@/lib/cms/repositories/homepage-repository";
import {
  LocalizedInput,
  emptyLocalized,
  newId,
  updateSettingsLocalized,
  type HomepageSectionEditorProps,
} from "../shared";

export function ChallengesSectionEditor({
  settings,
  setSettings,
  locale,
}: HomepageSectionEditorProps) {
  const t = useTranslations("admin.website.home");
  const section = settings.challenges;

  const setPoints = (points: HomepageChallengePoint[]) =>
    setSettings((prev) => ({ ...prev, challenges: { ...prev.challenges, points } }));
  const patchPoint = (index: number, patch: Partial<HomepageChallengePoint>) =>
    setPoints(section.points.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const pct = (v: string) => Math.min(100, Math.max(0, Number(v) || 0));
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  const snap = (n: number) => clamp(Math.round(n * 2) / 2);

  // Lens box is 112px; bg is 250% (280px). Centre the point, clamped to the image.
  const lensOffset = (v: number) => Math.min(0, Math.max(-(280 - 112), 56 - (v / 100) * 280));

  const [selected, setSelected] = useState(0);
  const dragging = useRef<number | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const sel = Math.min(selected, section.points.length - 1);
  const current = section.points[sel];

  const placeFromEvent = (e: React.PointerEvent, index: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height || index < 0) return;
    patchPoint(index, {
      x: snap(((e.clientX - rect.left) / rect.width) * 100),
      y: snap(((e.clientY - rect.top) / rect.height) * 100),
    });
  };
  const onKey = (e: React.KeyboardEvent, index: number) => {
    const step = e.shiftKey ? 5 : 0.5;
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = d[e.key];
    if (!delta) return;
    e.preventDefault();
    const p = section.points[index];
    patchPoint(index, { x: snap(p.x + delta[0]), y: snap(p.y + delta[1]) });
  };

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{t("sections.challenges.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label={t("fields.sectionTitle")}
          locale={locale}
          value={section.title[locale]}
          onChange={(l, v) => updateSettingsLocalized(setSettings, "challenges", "title", l, v)}
        />
        <ImageField
          label={t("fields.challengesImage")}
          value={section.image}
          onChange={(url) =>
            setSettings((prev) => ({ ...prev, challenges: { ...prev.challenges, image: url } }))
          }
        />
        <p className="text-sm font-medium">{t("fields.challengesPoints")}</p>
        <p className="text-sm text-muted-foreground">{t("fields.challengesPositionHint")}</p>
        {section.image && current ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("fields.challengesPickerHint")}</p>
            <div className="flex flex-wrap items-start gap-4">
              <div
                ref={areaRef}
                role="group"
                aria-label={t("fields.challengesPickerArea")}
                className="relative w-full max-w-xl touch-none select-none overflow-hidden rounded-lg border"
                onPointerDown={(e) => {
                  dragging.current = sel;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  placeFromEvent(e, sel);
                }}
                onPointerMove={(e) =>
                  dragging.current !== null && placeFromEvent(e, dragging.current)
                }
                onPointerUp={() => (dragging.current = null)}
                onPointerCancel={() => (dragging.current = null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={section.image} alt="" draggable={false} className="block h-auto w-full" />
                {section.points.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={t("fields.challengesPointLabel", { n: i + 1 })}
                    aria-pressed={i === sel}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelected(i);
                      dragging.current = i;
                      areaRef.current?.setPointerCapture(e.pointerId);
                    }}
                    onFocus={() => setSelected(i)}
                    onKeyDown={(e) => onKey(e, i)}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    className={`absolute flex size-7 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 text-xs font-semibold text-white shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue-dark ${
                      i === sel
                        ? "z-10 border-white bg-oboya-orange"
                        : "border-white/80 bg-oboya-blue"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div
                role="img"
                aria-label={t("fields.challengesLensPreview")}
                className="size-28 shrink-0 rounded-full border-2 border-oboya-blue bg-no-repeat"
                style={{
                  backgroundImage: `url("${section.image}")`,
                  backgroundSize: "250%",
                  backgroundPosition: `${lensOffset(current.x)}px ${lensOffset(current.y)}px`,
                }}
              />
            </div>
          </div>
        ) : null}
        {section.points.map((point, index) => (
          <div
            key={point.id}
            className={`space-y-3 rounded-lg border p-4 ${index === sel ? "border-oboya-orange" : ""}`}
            onFocusCapture={() => setSelected(index)}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {t("fields.challengesPointN", { index: index + 1 })}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPoints(section.points.filter((_, i) => i !== index))}
              >
                {t("fields.challengesRemovePoint")}
              </Button>
            </div>
            <LocalizedInput
              label={t("fields.challengesCaption")}
              locale={locale}
              value={point.caption[locale]}
              multiline
              onChange={(l, v) => patchPoint(index, { caption: { ...point.caption, [l]: v } })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {(["x", "y"] as const).map((axis) => (
                <div key={axis} className="space-y-1.5">
                  <Label>{t(axis === "x" ? "fields.challengesX" : "fields.challengesY")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={point[axis]}
                    onChange={(e) => patchPoint(index, { [axis]: pct(e.target.value) })}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={section.points.length >= HOME_CHALLENGES_MAX_POINTS}
          onClick={() =>
            setPoints([...section.points, { id: newId(), caption: emptyLocalized(), x: 50, y: 50 }])
          }
        >
          {t("fields.challengesAddPoint")}
        </Button>
      </CardContent>
    </Card>
  );
}
