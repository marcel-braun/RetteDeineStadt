import { defineIndustry } from "./types";

export const baeckerei = defineIndustry({
  key: "baeckerei",
  label: "Bäckerei",
  categories: [
    { key: "brot", label: "Brot" },
    { key: "kleingebaeck", label: "Kleingebäck" },
    { key: "kuchen", label: "Kuchen" },
    { key: "herzhaft", label: "Herzhaft" },
  ],
  fields: [
    { key: "gewicht", label: "Gewicht", type: "text", required: true },
    { key: "hefefrei", label: "Hefefrei", type: "boolean", required: false },
  ],
  filters: [{ key: "hefefrei", label: "Hefefrei" }],
});
