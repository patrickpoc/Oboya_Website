function normalizeProductTag(raw) {
  const tag = raw.trim().toLowerCase();
  return tag.length > 0 ? tag : null;
}

function addProductTag(tags, raw) {
  const tag = normalizeProductTag(raw);
  if (!tag || tags.includes(tag)) return tags;
  return [...tags, tag];
}

function removeProductTag(tags, raw) {
  const tag = normalizeProductTag(raw);
  if (!tag) return tags;
  return tags.filter((item) => item !== tag);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(normalizeProductTag("  Organic  ") === "organic", "normalize trims and lowercases");
assert(normalizeProductTag("   ") === null, "empty becomes null");
assert(
  addProductTag(["premium"], "Organic").join(",") === "premium,organic",
  "add dedupes case-insensitively"
);
assert(addProductTag(["premium"], "premium").length === 1, "add ignores duplicates");
assert(removeProductTag(["a", "b"], "B").join(",") === "a", "remove is case-insensitive");

function matchesTagSearch(productTags, query) {
  const q = query.toLowerCase().trim();
  return productTags.some((tag) => tag.toLowerCase().includes(q));
}

assert(matchesTagSearch(["organic", "premium"], "org"), "search finds partial tag");
assert(!matchesTagSearch(["organic"], "xyz"), "search misses unknown tag");

console.log("product-tags verification passed");
