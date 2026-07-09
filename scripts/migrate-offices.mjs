import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "data", "map-locations.json");
const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));

const locales = ["en", "pt-BR", "es", "zh-CN"];
const officeKeys = [
  "company",
  "partner",
  "operationType",
  "city",
  "facility",
  "segments",
  "phone",
];

function slug(base, existing) {
  let id = base;
  let n = 2;
  while (existing.includes(id)) {
    id = `${base}${n}`;
    n += 1;
  }
  existing.push(id);
  return id;
}

for (const location of raw.locations) {
  const email =
    typeof location.email === "string"
      ? location.email
      : `${location.id}@oboya.example`;

  if (!Array.isArray(location.offices) || location.offices.length === 0) {
    const officeIds = [];
    const primaryId = slug(`${location.id}-office`, officeIds);

    location.offices = [
      {
        id: primaryId,
        email,
        translations: Object.fromEntries(
          locales.map((locale) => {
            const source = location.translations?.[locale] ?? {};
            return [
              locale,
              Object.fromEntries(
                officeKeys.map((key) => [key, source[key] ?? ""])
              ),
            ];
          })
        ),
      },
    ];
  }

  for (const locale of locales) {
    const source = location.translations?.[locale] ?? {};
    location.translations[locale] = {
      country: source.country ?? "",
    };
  }

  delete location.email;
}

// Demo: second office for USA and Brazil
function addDemoOffice(locationId, officeId, email, en, ptBR, es, zh) {
  const location = raw.locations.find((item) => item.id === locationId);
  if (!location) return;

  location.offices.push({
    id: officeId,
    email,
    translations: {
      en,
      "pt-BR": ptBR,
      es,
      "zh-CN": zh,
    },
  });
}

addDemoOffice(
  "usa",
  "usa-west",
  "usa-west@oboya.example",
  {
    company: "Oboya Horticulture",
    partner: "Oboya West Distribution",
    operationType: "Regional warehouse",
    city: "Los Angeles",
    facility: "West coast distribution center",
    segments: "Packaging, Equipment",
    phone: "+00 (00) 0000-0001",
  },
  {
    company: "Oboya Horticulture",
    partner: "Oboya West Distribution",
    operationType: "Armazém regional",
    city: "Los Angeles",
    facility: "Centro de distribuição da costa oeste",
    segments: "Embalagens, Equipamentos",
    phone: "+00 (00) 0000-0001",
  },
  {
    company: "Oboya Horticulture",
    partner: "Oboya West Distribution",
    operationType: "Almacén regional",
    city: "Los Ángeles",
    facility: "Centro de distribución de la costa oeste",
    segments: "Embalaje, Equipamiento",
    phone: "+00 (00) 0000-0001",
  },
  {
    company: "Oboya Horticulture",
    partner: "Oboya West Distribution",
    operationType: "区域仓库",
    city: "洛杉矶",
    facility: "西海岸配送中心",
    segments: "包装, 设备",
    phone: "+00 (00) 0000-0001",
  }
);

addDemoOffice(
  "brazil",
  "brazil-factory",
  "brazil-factory@oboya.example",
  {
    company: "Oboya Horticulture",
    partner: "Oboya Brasil",
    operationType: "Production facility",
    city: "Campinas",
    facility: "Growing media production plant",
    segments: "Growing Media, Substrates",
    phone: "+00 (00) 0000-0002",
  },
  {
    company: "Oboya Horticulture",
    partner: "Oboya Brasil",
    operationType: "Unidade de produção",
    city: "Campinas",
    facility: "Fábrica de substratos",
    segments: "Substratos",
    phone: "+00 (00) 0000-0002",
  },
  {
    company: "Oboya Horticulture",
    partner: "Oboya Brasil",
    operationType: "Planta de producción",
    city: "Campinas",
    facility: "Planta de sustratos",
    segments: "Sustratos",
    phone: "+00 (00) 0000-0002",
  },
  {
    company: "Oboya Horticulture",
    partner: "Oboya Brasil",
    operationType: "生产工厂",
    city: "坎皮纳斯",
    facility: "栽培基质生产厂",
    segments: "基质",
    phone: "+00 (00) 0000-0002",
  }
);

fs.writeFileSync(filePath, `${JSON.stringify(raw, null, 2)}\n`);
console.log("Migrated map locations to offices structure");
