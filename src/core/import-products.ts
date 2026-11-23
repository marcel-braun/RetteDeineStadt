import { CSV_BASE, csvObjects } from "./csv";
import type { Attributes, IndustryModule } from "./industries/types";
import { parseMinorUnits } from "./money";
import { parseStock, slugify } from "./text";

export type ImportProduct = {
  importKey: string;
  name: string;
  description: string;
  categoryKey: string;
  axisLabel: string | null;
  attributes: Attributes;
  variants: { label: string; priceCents: number; stock: number }[];
};

export type ImportPlan = {
  products: ImportProduct[];
  errors: { line: number; message: string }[];
  acceptedRows: number;
};

type Draft = {
  line: number;
  importKey: string;
  name: string;
  description: string;
  categoryKey: string;
  axis: string;
  label: string;
  priceCents: number;
  stock: number;
  attributes: Attributes;
};

export function planImport(csv: string, industry: IndustryModule): ImportPlan {
  const { header, rows } = csvObjects(csv);
  const errors: { line: number; message: string }[] = [];
  if (header.length === 0) return { products: [], errors: [{ line: 1, message: "Die Datei ist leer." }], acceptedRows: 0 };

  const missing = [...CSV_BASE, ...industry.fields.map((field) => field.key)].filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return {
      products: [],
      errors: [{ line: 1, message: `Es fehlen Spalten dieser Branche: ${missing.join(", ")}.` }],
      acceptedRows: 0,
    };
  }

  const drafts: Draft[] = [];
  rows.forEach((row, index) => {
    const line = index + 2;
    const rowErrors: string[] = [];
    const key = slugify(row.produkt_schluessel ?? "");
    if (!key) rowErrors.push("Produktschlüssel fehlt.");
    const name = (row.name ?? "").trim();
    if (!name) rowErrors.push("Name fehlt.");
    const categoryKey = (row.kategorie ?? "").trim();
    if (!industry.categories.some((category) => category.key === categoryKey)) rowErrors.push("Kategorie gehört nicht zu dieser Branche.");
    const priceCents = parseMinorUnits(row.preis ?? "");
    if (priceCents === null) rowErrors.push("Preis ist ungültig.");
    const stock = parseStock(row.bestand ?? "");
    if (stock === null) rowErrors.push("Bestand ist ungültig.");
    const raw: Record<string, string> = {};
    for (const field of industry.fields) raw[field.key] = row[field.key] ?? "";
    const checked = industry.validate(raw);
    if (!checked.ok) rowErrors.push(...checked.errors);
    if (rowErrors.length > 0 || !checked.ok || priceCents === null || stock === null) {
      errors.push({ line, message: rowErrors.join(" ") });
      return;
    }
    drafts.push({
      line,
      importKey: key,
      name,
      description: (row.beschreibung ?? "").trim(),
      categoryKey,
      axis: (row.achse ?? "").trim(),
      label: (row.variante ?? "").trim(),
      priceCents,
      stock,
      attributes: checked.value,
    });
  });

  const groups = new Map<string, Draft[]>();
  for (const draft of drafts) {
    const group = groups.get(draft.importKey) ?? [];
    group.push(draft);
    groups.set(draft.importKey, group);
  }

  const products: ImportProduct[] = [];
  let acceptedRows = 0;
  for (const [importKey, group] of groups) {
    const first = group[0];
    const signature = JSON.stringify(first.attributes);
    const usable: Draft[] = [];
    for (const draft of group) {
      const same =
        draft.name === first.name &&
        draft.categoryKey === first.categoryKey &&
        draft.axis === first.axis &&
        JSON.stringify(draft.attributes) === signature;
      if (!same) {
        errors.push({ line: draft.line, message: "Die Zeile widerspricht der ersten Zeile dieses Produkts." });
        continue;
      }
      usable.push(draft);
    }
    if (usable.length === 0) continue;
    const axis = first.axis;
    const labels = new Set<string>();
    const variants: ImportProduct["variants"] = [];
    let broken = false;
    for (const draft of usable) {
      const label = !axis && usable.length === 1 ? draft.label || "Standard" : draft.label;
      if (!label) {
        errors.push({ line: draft.line, message: "Variante fehlt. Bei mehreren Zeilen oder einer Achse braucht jede Zeile eine Variante." });
        broken = true;
        continue;
      }
      if (labels.has(label)) {
        errors.push({ line: draft.line, message: "Dieselbe Variante steht mehrfach in der Datei." });
        broken = true;
        continue;
      }
      labels.add(label);
      variants.push({ label, priceCents: draft.priceCents, stock: draft.stock });
    }
    if (broken && variants.length === 0) continue;
    if (variants.length > 1 && !axis) {
      for (const draft of usable) errors.push({ line: draft.line, message: "Mehrere Varianten brauchen eine Achse." });
      continue;
    }
    products.push({
      importKey,
      name: first.name,
      description: first.description,
      categoryKey: first.categoryKey,
      axisLabel: axis || null,
      attributes: first.attributes,
      variants,
    });
    acceptedRows += variants.length;
  }

  errors.sort((a, b) => a.line - b.line);
  return { products, errors, acceptedRows };
}
