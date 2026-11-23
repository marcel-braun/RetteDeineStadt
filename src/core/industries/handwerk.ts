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
    {
      key: "material",
      label: "Material",
      type: "select",
      required: true,
      options: [
        { value: "holz", label: "Holz" },
        { value: "keramik", label: "Keramik" },
        { value: "textil", label: "Textil" },
        { value: "papier", label: "Papier" },
        { value: "glas", label: "Glas" },
        { value: "metall", label: "Metall" },
      ],
    },
  ],
  filters: [{ key: "material", label: "Material" }],
});
