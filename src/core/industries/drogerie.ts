import { defineIndustry } from "./types";

export const drogerie = defineIndustry({
  key: "drogerie",
  label: "Drogerie und Haushalt",
  categories: [
    { key: "koerper", label: "Körperpflege" },
    { key: "haushalt", label: "Haushalt" },
    { key: "waschen", label: "Waschen" },
  ],
  fields: [
    { key: "inhalt", label: "Inhalt", type: "text", required: true },
    { key: "inhaltsstoffe", label: "Inhaltsstoffe", type: "text", required: true },
    {
      key: "anwendungsbereich",
      label: "Anwendungsbereich",
      type: "select",
      required: true,
      options: [
        { value: "koerper", label: "Körperpflege" },
        { value: "haushalt", label: "Haushalt" },
        { value: "waschen", label: "Waschen" },
        { value: "kueche", label: "Küche" },
      ],
    },
  ],
  filters: [{ key: "anwendungsbereich", label: "Anwendungsbereich" }],
});
