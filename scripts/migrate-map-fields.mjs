import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "data", "map-locations.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

const cityById = {
  usa: "Atlanta",
  mexico: "Mexico City",
  ecuador: "Quito",
  colombia: "Bogotá",
  peru: "Lima",
  chile: "Santiago",
  brazil: "São Paulo",
  argentina: "Buenos Aires",
  uk: "London",
  norway: "Oslo",
  sweden: "Malmö",
  poland: "Warsaw",
  ethiopia: "Addis Ababa",
  kenya: "Nairobi",
  "south-africa": "Cape Town",
  uae: "Dubai",
  india: "Mumbai",
  china: "Shanghai",
  "hong-kong": "Hong Kong",
  singapore: "Singapore",
};

for (const location of data.locations) {
  location.email = location.email ?? `${location.id}@oboya.example`;

  for (const locale of Object.keys(location.translations)) {
    const translation = location.translations[locale];
    translation.partner = translation.partner ?? translation.company ?? "Oboya Horticulture";
    translation.operationType =
      translation.operationType ?? translation.facility ?? "Sales office";
    translation.city = translation.city ?? cityById[location.id] ?? "Main office";
    translation.segments =
      translation.segments ?? "Vegetables, Flowers, Packaging, Equipment";
  }
}

fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
console.log("Updated map-locations.json");
