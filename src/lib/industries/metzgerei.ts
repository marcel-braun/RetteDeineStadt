import { defineIndustry } from "./types";

export const metzgerei = defineIndustry({
  key: "metzgerei",
  label: "Metzgerei",
  categories: [
    { key: "wurst", label: "Wurst" },
    { key: "frischfleisch", label: "Frischfleisch" },
    { key: "aufschnitt", label: "Aufschnitt" },
  ],
  fields: [
    {
      key: "tierart",
      label: "Tierart",
      type: "select",
      required: true,
      options: [
        { value: "schwein", label: "Schwein" },
        { value: "rind", label: "Rind" },
        { value: "gefluegel", label: "Geflügel" },
        { value: "gemischt", label: "Gemischt" },
      ],
    },
    { key: "gekuehlt", label: "Gekühlt", type: "boolean", required: false },
  ],
  filters: [
    { key: "tierart", label: "Tierart" },
    { key: "gekuehlt", label: "Gekühlt" },
  ],
});
