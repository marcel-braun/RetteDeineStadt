import { defineIndustry } from "./types";

const allergene = [
  { value: "gluten", label: "Gluten" },
  { value: "milch", label: "Milch" },
  { value: "ei", label: "Ei" },
  { value: "nuesse", label: "Nüsse" },
  { value: "sellerie", label: "Sellerie" },
  { value: "senf", label: "Senf" },
];

export const lebensmittel = defineIndustry({
  key: "lebensmittel",
  label: "Lebensmittel und Hofladen",
  categories: [
    { key: "gemuese", label: "Gemüse" },
    { key: "obst", label: "Obst" },
    { key: "milch-ei", label: "Milch und Ei" },
    { key: "honig", label: "Honig" },
    { key: "vorrat", label: "Vorrat" },
  ],
  fields: [
    { key: "herkunft", label: "Herkunft", type: "text", required: true },
    { key: "einheit", label: "Einheit", type: "text", required: true },
    { key: "bio", label: "Bio", type: "boolean", required: false },
    { key: "regional", label: "Regional", type: "boolean", required: false },
    { key: "allergene", label: "Allergene", type: "tokens", required: false, options: allergene },
  ],
  filters: [
    { key: "bio", label: "Bio" },
    { key: "regional", label: "Regional" },
    { key: "allergene", label: "Allergene" },
  ],
});
