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
    {
      key: "gebinde",
      label: "Gebinde",
      type: "select",
      required: true,
      options: [
        { value: "flasche", label: "Flasche" },
        { value: "kasten", label: "Kasten" },
        { value: "dose", label: "Dose" },
        { value: "glas", label: "Glas" },
      ],
    },
  ],
  filters: [{ key: "gebinde", label: "Gebinde" }],
});
