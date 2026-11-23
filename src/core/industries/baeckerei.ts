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
    {
      key: "art",
      label: "Art",
      type: "select",
      required: true,
      options: [
        { value: "sauerteig", label: "Sauerteig" },
        { value: "hefe", label: "Hefeteig" },
        { value: "ruehr", label: "Rührteig" },
        { value: "muerbe", label: "Mürbeteig" },
      ],
    },
  ],
  filters: [{ key: "art", label: "Art" }],
});
