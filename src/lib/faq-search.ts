/**
 * Lightweight FAQ search: exact substring match or similar tokens
 * (Levenshtein / prefix), after accent-insensitive normalization.
 */

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeSearchText(value)
    .split(/[^a-z0-9\u4e00-\u9fff]+/i)
    .filter((t) => t.length >= 2);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const prev = new Array<number>(cols);
  const curr = new Array<number>(cols);

  for (let j = 0; j < cols; j++) prev[j] = j;

  for (let i = 1; i < rows; i++) {
    curr[0] = i;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j < cols; j++) prev[j] = curr[j];
  }

  return prev[cols - 1];
}

function tokensSimilar(queryToken: string, textToken: string): boolean {
  if (queryToken === textToken) return true;
  if (textToken.includes(queryToken) || queryToken.includes(textToken)) {
    return true;
  }

  const maxLen = Math.max(queryToken.length, textToken.length);
  if (Math.abs(queryToken.length - textToken.length) > 2) return false;

  const threshold = maxLen >= 5 ? 2 : 1;
  return levenshtein(queryToken, textToken) <= threshold;
}

/** True if haystack matches query exactly (substring) or via similar tokens. */
export function matchesFaqSearch(query: string, ...fields: string[]): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  const haystack = normalizeSearchText(fields.filter(Boolean).join(" "));

  // Exact: full query as substring
  if (haystack.includes(q)) return true;

  const queryTokens = tokenize(q);
  if (queryTokens.length === 0) return haystack.includes(q);

  const textTokens = tokenize(haystack);
  if (textTokens.length === 0) return false;

  // Every query token must match at least one text token (exact or similar)
  return queryTokens.every((qt) =>
    textTokens.some((tt) => tokensSimilar(qt, tt))
  );
}
