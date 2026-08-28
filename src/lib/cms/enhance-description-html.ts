export function enhanceDescriptionHtmlForDisplay(html: string): string {
  if (!html.trim()) return "";
  let index = 0;
  return html.replace(/<img\b/gi, () => {
    index += 1;
    return index === 1 ? "<img" : '<img loading="lazy"';
  });
}
