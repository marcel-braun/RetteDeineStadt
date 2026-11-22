import { defineIndustry } from "./types";

export const handwerk = defineIndustry({
  key: "handwerk",
  label: "Handwerk und Geschenke",
  categories: [
    { key: "keramik", label: "Keramik" },
    { key: "textil", label: "Textil" },
    { key: "holz", label: "Holz" },
    { key: "papier", label: "Papier" },
  ],
  fields: [
    { key: "material", label: "Material", type: "text", required: true },
    { key: "unikat", label: "Unikat", type: "boolean", required: false },
  ],
  filters: [{ key: "unikat", label: "Unikat" }],
});
