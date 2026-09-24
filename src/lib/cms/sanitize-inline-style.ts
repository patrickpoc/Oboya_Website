/** Whitelist safe CSS declarations used by the rich-text editor. */

const COLOR_RE =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)|var\(--oboya-[a-z0-9-]+\))$/i;
const SIZE_RE = /^\d+(\.\d+)?(px|rem|em|%)$/;
const ALIGN_RE = /^(left|center|right|justify)$/;

const ALLOWED_PROPS: Record<string, RegExp> = {
  color: COLOR_RE,
  "font-size": SIZE_RE,
  "text-align": ALIGN_RE,
  width: SIZE_RE,
  height: SIZE_RE,
  "max-width": SIZE_RE,
};

export function sanitizeInlineStyle(style: string | null | undefined): string {
  if (!style?.trim()) return "";

  const kept: string[] = [];
  for (const part of style.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon <= 0) continue;
    const prop = trimmed.slice(0, colon).trim().toLowerCase();
    const value = trimmed.slice(colon + 1).trim();
    if (!value || /expression|url\s*\(|javascript:/i.test(value)) continue;
    const pattern = ALLOWED_PROPS[prop];
    if (pattern && pattern.test(value)) {
      kept.push(`${prop}: ${value}`);
    }
  }
  return kept.join("; ");
}

export function applySanitizedStyleAttr(el: Element) {
  const raw = el.getAttribute("style");
  if (!raw) return;
  const next = sanitizeInlineStyle(raw);
  if (next) {
    el.setAttribute("style", next);
  } else {
    el.removeAttribute("style");
  }
}
