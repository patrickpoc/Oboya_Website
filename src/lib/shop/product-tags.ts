export function normalizeProductTag(raw: string): string | null {
  const tag = raw.trim().toLowerCase();
  return tag.length > 0 ? tag : null;
}

export function addProductTag(tags: string[], raw: string): string[] {
  const tag = normalizeProductTag(raw);
  if (!tag || tags.includes(tag)) return tags;
  return [...tags, tag];
}

export function removeProductTag(tags: string[], raw: string): string[] {
  const tag = normalizeProductTag(raw);
  if (!tag) return tags;
  return tags.filter((item) => item !== tag);
}
