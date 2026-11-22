import { defineIndustry } from "./types";

export const blumen = defineIndustry({
  key: "blumen",
  label: "Blumen und Pflanzen",
  categories: [
    { key: "straeusse", label: "Sträuße" },
    { key: "topf", label: "Topfpflanzen" },
    { key: "saison", label: "Saison" },
    { key: "trocken", label: "Trocken" },
  ],
  fields: [
    { key: "haltbarkeit", label: "Haltbarkeit", type: "text", required: true },
    { key: "saison", label: "Saisonware", type: "boolean", required: false },
  ],
  filters: [{ key: "saison", label: "Saisonware" }],
});
