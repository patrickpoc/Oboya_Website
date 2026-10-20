import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const messagesDir = path.join(root, "messages");
const locales = ["en", "pt-BR", "es", "zh-CN"];

function monolithPath(locale) {
  return path.join(messagesDir, `${locale}.json`);
}

function localeDir(locale) {
  return path.join(messagesDir, locale);
}

function readMonolith(locale) {
  return JSON.parse(fs.readFileSync(monolithPath(locale), "utf8"));
}

function readFolder(locale) {
  const dir = localeDir(locale);
  const index = fs.readFileSync(path.join(dir, "index.ts"), "utf8");
  const order = [...index.matchAll(/import \w+ from "\.\/([^"]+)\.json"/g)].map((match) => match[1]);
  const data = {};
  for (const name of order) {
    data[name] = JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8"));
  }
  return data;
}

function same(left, right) {
  if (typeof left !== typeof right) return false;
  if (left === null || right === null || typeof left !== "object") return left === right;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => same(value, right[index]));
  }
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key, index) => key === rightKeys[index] && same(left[key], right[key]));
}

function writeIndex(locale, names) {
  const imports = names
    .map((name) => `import ${name} from "./${name}.json";`)
    .join("\n");
  const body = names.join(",\n  ");
  const source = `${imports}\n\nconst messages = {\n  ${body},\n};\n\nexport default messages;\n`;
  fs.writeFileSync(path.join(localeDir(locale), "index.ts"), source);
}

function splitLocale(locale) {
  const data = readMonolith(locale);
  const dir = localeDir(locale);
  fs.mkdirSync(dir, { recursive: true });
  const names = Object.keys(data);
  for (const name of names) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(`Namespace "${name}" is not a safe filename`);
    }
    fs.writeFileSync(
      path.join(dir, `${name}.json`),
      `${JSON.stringify(data[name], null, 2)}\n`
    );
  }
  writeIndex(locale, names);
  return data;
}

function verify() {
  let failed = false;
  for (const locale of locales) {
    const original = readMonolith(locale);
    const dir = localeDir(locale);
    const scratch = path.join(root, ".tmp", `i18n-verify-${locale}`);
    fs.rmSync(scratch, { recursive: true, force: true });
    fs.mkdirSync(scratch, { recursive: true });
    const names = Object.keys(original);
    for (const name of names) {
      fs.writeFileSync(path.join(scratch, `${name}.json`), `${JSON.stringify(original[name], null, 2)}\n`);
    }
    const joined = {};
    for (const name of names) {
      joined[name] = JSON.parse(fs.readFileSync(path.join(scratch, `${name}.json`), "utf8"));
    }
    fs.rmSync(scratch, { recursive: true, force: true });
    if (!same(original, joined)) {
      console.error(`${locale}: split is not identical to the monolith`);
      failed = true;
      continue;
    }
    if (fs.existsSync(dir)) {
      const fromDisk = readFolder(locale);
      if (!same(original, fromDisk)) {
        console.error(`${locale}: folder does not match the monolith`);
        failed = true;
        continue;
      }
    }
    console.log(`${locale}: ${names.length} namespaces match`);
  }
  if (failed) process.exit(1);
}

const command = process.argv[2];

if (command === "--verify" || command === "verify") {
  verify();
} else if (command === "split") {
  verify();
  for (const locale of locales) {
    splitLocale(locale);
    fs.rmSync(monolithPath(locale));
    console.log(`split ${locale}`);
  }
} else if (command === "join") {
  for (const locale of locales) {
    const data = readFolder(locale);
    fs.writeFileSync(monolithPath(locale), `${JSON.stringify(data, null, 2)}\n`);
    console.log(`joined ${locale}`);
  }
} else {
  console.error("Usage: node scripts/i18n-split.mjs split | join | --verify");
  process.exit(1);
}
