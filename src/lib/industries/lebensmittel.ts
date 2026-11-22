import { defineIndustry } from "./types";

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
    { key: "gekuehlt", label: "Gekühlt", type: "boolean", required: false },
  ],
  filters: [{ key: "gekuehlt", label: "Gekühlt" }],
});
