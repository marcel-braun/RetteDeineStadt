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
    { key: "nachfuellbar", label: "Nachfüllbar", type: "boolean", required: false },
  ],
  filters: [{ key: "nachfuellbar", label: "Nachfüllbar" }],
});
