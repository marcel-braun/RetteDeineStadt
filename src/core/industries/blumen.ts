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
    {
      key: "anlass",
      label: "Anlass",
      type: "select",
      required: true,
      options: [
        { value: "alltag", label: "Alltag" },
        { value: "geburtstag", label: "Geburtstag" },
        { value: "hochzeit", label: "Hochzeit" },
        { value: "trauer", label: "Trauer" },
        { value: "saison", label: "Saison" },
      ],
    },
  ],
  filters: [{ key: "anlass", label: "Anlass" }],
});
