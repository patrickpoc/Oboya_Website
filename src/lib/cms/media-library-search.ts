import { matchesFaqSearch, normalizeSearchText } from "@/lib/faq-search";

export function scoreMediaLibrarySearch(query: string, fields: string[]): number {
  const q = normalizeSearchText(query);
  if (!q) return 1;

  const haystack = normalizeSearchText(fields.filter(Boolean).join(" "));
  if (!haystack) return 0;

  if (!matchesFaqSearch(query, ...fields)) return 0;

  if (haystack.includes(q)) return 100;

  const queryTokens = q.split(/\s+/).filter(Boolean);
  let score = 40;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 15;
  }
  return score;
}
