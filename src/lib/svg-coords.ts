export function screenToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;

  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return { x: 0, y: 0 };
  }

  const svgPoint = point.matrixTransform(ctm.inverse());

  return {
    x: Math.round(svgPoint.x * 100) / 100,
    y: Math.round(svgPoint.y * 100) / 100,
  };
}
