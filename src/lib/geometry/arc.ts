/** Shared arc / circle-from-chord geometry (About timeline & home ecosystem). */

export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** SVG elliptical-arc path between two polar angles (degrees, 0 = up). */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export type CircleFromChord = {
  radius: number;
  cx: number;
  cy: number;
  alpha: number;
  rise: number;
};

/**
 * Circle defined by a horizontal chord of length `width` and vertical rise.
 * Apex sits at `apexPad`; center is below the apex (upper bowl visible).
 */
export function circleFromChord(
  width: number,
  rise: number,
  apexPad = 0
): CircleFromChord {
  const w = Math.max(width, 1);
  const safeRise = Math.max(rise, 1);
  const radius =
    (safeRise * safeRise + (w / 2) * (w / 2)) / (2 * safeRise);
  const alphaRad = Math.acos(
    Math.min(1, Math.max(0, (radius - safeRise) / radius))
  );
  const alpha = (alphaRad * 180) / Math.PI;
  const cx = w / 2;
  const cy = apexPad + radius;
  return { radius, cx, cy, alpha, rise: safeRise };
}

/** Closed path: arc + chord (filled semicircle / bowl window). */
export function describeClosedBowl(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const arc = describeArc(cx, cy, r, startAngle, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const start = polarToCartesian(cx, cy, r, endAngle);
  return `${arc} L ${end.x} ${end.y} L ${start.x} ${start.y} Z`;
}
