import { defineIndustry } from "./types";

export const fertiggerichte = defineIndustry({
  key: "fertiggerichte",
  label: "Fertiggerichte und Imbiss",
  categories: [
    { key: "suppen", label: "Suppen" },
    { key: "eintoepfe", label: "Eintöpfe" },
    { key: "belegte", label: "Belegte" },
    { key: "suesses", label: "Süßes" },
  ],
  fields: [
    { key: "allergene", label: "Allergene", type: "text", required: true },
    { key: "warm", label: "Warm zum Mitnehmen", type: "boolean", required: false },
  ],
  filters: [{ key: "warm", label: "Warm zum Mitnehmen" }],
});
