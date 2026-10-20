import fs from "node:fs";
import path from "node:path";

const messagesDir = path.join(process.cwd(), "messages");
const locales = ["en", "pt-BR", "es", "zh-CN"];
function skipBalanced(text, start) {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    else if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return text.length;
}

function placeholders(text) {
  const found = new Set();
  const branch = new Set(["one", "other", "zero", "few", "many", "two", "offset"]);
  let index = 0;
  while (index < text.length) {
    if (text[index] !== "{") {
      index += 1;
      continue;
    }
    const rest = text.slice(index + 1);
    const typed = rest.match(/^(\w+)\s*,\s*(plural|select|selectordinal|number|date|time)/);
    if (typed) {
      found.add(`${typed[1]}:${typed[2]}`);
      index = skipBalanced(text, index);
      continue;
    }
    const simple = rest.match(/^(\w+)\s*}/);
    if (simple && !branch.has(simple[1])) found.add(simple[1]);
    index += 1;
  }
  return [...found].sort().join(",");
}

function loadLocale(locale) {
  const dir = path.join(messagesDir, locale);
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing messages/${locale}/`);
  }
  const data = {};
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    data[file.replace(/\.json$/, "")] = JSON.parse(
      fs.readFileSync(path.join(dir, file), "utf8")
    );
  }
  return data;
}

function shape(value, prefix, out) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => shape(item, `${prefix}[${index}]`, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) shape(value[key], prefix ? `${prefix}.${key}` : key, out);
    return;
  }
  out.set(prefix, typeof value === "string" ? value : JSON.stringify(value));
}

const base = loadLocale("en");
const baseShape = new Map();
shape(base, "", baseShape);
let failed = false;

for (const locale of locales) {
  if (locale === "en") continue;
  const current = new Map();
  shape(loadLocale(locale), "", current);
  for (const key of baseShape.keys()) {
    if (!current.has(key)) {
      console.error(`${locale} missing ${key}`);
      failed = true;
    }
  }
  for (const key of current.keys()) {
    if (!baseShape.has(key)) {
      console.error(`${locale} extra ${key}`);
      failed = true;
    }
  }
  for (const key of baseShape.keys()) {
    if (!current.has(key)) continue;
    const expected = placeholders(baseShape.get(key));
    const actual = placeholders(current.get(key));
    if (expected !== actual) {
      console.error(`${locale} placeholders differ at ${key}: en=[${expected}] ${locale}=[${actual}]`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("i18n: 4 locales match en");
