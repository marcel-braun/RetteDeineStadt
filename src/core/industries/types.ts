export type AttributeValue = string | boolean | string[];
export type Attributes = Record<string, AttributeValue>;

export type IndustryField = {
  key: string;
  label: string;
  type: "text" | "boolean" | "select" | "tokens";
  required: boolean;
  options?: { value: string; label: string }[];
};

export type IndustrySpec = {
  key: string;
  label: string;
  categories: { key: string; label: string }[];
  fields: IndustryField[];
  filters: { key: string; label: string }[];
};

export type IndustryModule = IndustrySpec & {
  categoryLabel: (key: string) => string;
  fieldLabel: (key: string) => string;
  validate: (input: unknown) => { ok: true; value: Attributes } | { ok: false; errors: string[] };
  matches: (attributes: Attributes, selection: Record<string, string>) => boolean;
};

function isTrue(value: unknown) {
  return value === true || value === "true" || value === "ja" || value === "1" || value === "on" || value === "yes";
}

function tokenList(raw: unknown) {
  const source = Array.isArray(raw) ? raw : String(raw ?? "").split(/[;,]/);
  return [...new Set(source.map((entry) => String(entry).trim()).filter(Boolean))];
}

function validateFields(fields: IndustryField[], input: unknown) {
  const source =
    input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const value: Attributes = {};
  const errors: string[] = [];

  for (const field of fields) {
    const raw = source[field.key];
    if (field.type === "boolean") {
      value[field.key] = isTrue(raw);
      continue;
    }
    if (field.type === "tokens") {
      const tokens = tokenList(raw);
      const options = field.options ?? [];
      if (tokens.length === 0 && field.required) errors.push(`${field.label} fehlt.`);
      else if (tokens.some((token) => !options.some((option) => option.value === token))) {
        errors.push(`${field.label} ist ungültig.`);
      } else if (tokens.length > 0) value[field.key] = tokens;
      continue;
    }
    const text = raw === undefined || raw === null ? "" : String(raw).trim();
    if (field.type === "select") {
      const options = field.options ?? [];
      if (!text && field.required) errors.push(`${field.label} fehlt.`);
      else if (text && !options.some((option) => option.value === text)) errors.push(`${field.label} ist ungültig.`);
      else if (text) value[field.key] = text;
      continue;
    }
    if (!text && field.required) errors.push(`${field.label} fehlt.`);
    else if (text.length > 200) errors.push(`${field.label} ist zu lang.`);
    else if (text) value[field.key] = text;
  }

  if (errors.length > 0) return { ok: false as const, errors };
  return { ok: true as const, value };
}

function matchesFields(
  fields: IndustryField[],
  filters: { key: string; label: string }[],
  attributes: Attributes,
  selection: Record<string, string>,
) {
  for (const filter of filters) {
    const chosen = selection[filter.key];
    if (!chosen) continue;
    const field = fields.find((item) => item.key === filter.key);
    if (!field) return false;
    const current = attributes[filter.key];
    if (field.type === "boolean") {
      if (chosen !== "ja" && chosen !== "nein") continue;
      if (Boolean(current) !== (chosen === "ja")) return false;
    } else if (field.type === "tokens") {
      const tokens = Array.isArray(current) ? current : [];
      if (!tokens.includes(chosen)) return false;
    } else if (current !== chosen) {
      return false;
    }
  }
  return true;
}

export function defineIndustry(spec: IndustrySpec): IndustryModule {
  for (const filter of spec.filters) {
    const field = spec.fields.find((item) => item.key === filter.key);
    if (!field) throw new Error(`Branche ${spec.key}: Filter ${filter.key} hat kein Feld.`);
    if (field.type === "text") throw new Error(`Branche ${spec.key}: Textfeld ${filter.key} taugt nicht als Filter.`);
  }

  return {
    ...spec,
    categoryLabel(key) {
      return spec.categories.find((item) => item.key === key)?.label ?? key;
    },
    fieldLabel(key) {
      return spec.fields.find((item) => item.key === key)?.label ?? key;
    },
    validate(input) {
      return validateFields(spec.fields, input);
    },
    matches(attributes, selection) {
      return matchesFields(spec.fields, spec.filters, attributes, selection);
    },
  };
}

export function readAttributes(value: unknown): Attributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const attributes: Attributes = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "boolean" || typeof entry === "string") attributes[key] = entry;
    else if (Array.isArray(entry) && entry.every((item) => typeof item === "string")) attributes[key] = entry;
  }
  return attributes;
}

export function presentAttribute(field: IndustryField, value: AttributeValue | undefined) {
  if (value === undefined) return null;
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (Array.isArray(value)) {
    return value.map((token) => field.options?.find((option) => option.value === token)?.label ?? token).join(", ");
  }
  if (field.type === "select") return field.options?.find((option) => option.value === value)?.label ?? value;
  return value;
}
