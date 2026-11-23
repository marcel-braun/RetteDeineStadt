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
    {
      key: "ernaehrung",
      label: "Ernährung",
      type: "select",
      required: true,
      options: [
        { value: "vegetarisch", label: "Vegetarisch" },
        { value: "vegan", label: "Vegan" },
        { value: "fleisch", label: "Mit Fleisch" },
        { value: "gemischt", label: "Gemischt" },
      ],
    },
  ],
  filters: [{ key: "ernaehrung", label: "Ernährung" }],
});
