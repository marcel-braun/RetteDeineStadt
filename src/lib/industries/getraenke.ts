import { defineIndustry } from "./types";

export const getraenke = defineIndustry({
  key: "getraenke",
  label: "Getränke",
  categories: [
    { key: "saft", label: "Saft" },
    { key: "wein-bier", label: "Wein und Bier" },
    { key: "alkoholfrei", label: "Alkoholfrei" },
    { key: "wasser", label: "Wasser" },
  ],
  fields: [
    { key: "inhalt", label: "Inhalt", type: "text", required: true },
    { key: "alkoholfrei", label: "Alkoholfrei", type: "boolean", required: false },
  ],
  filters: [{ key: "alkoholfrei", label: "Alkoholfrei" }],
});
