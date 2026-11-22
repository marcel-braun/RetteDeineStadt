export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function makeSku(tenantSlug: string, importKey: string, label: string) {
  return `${tenantSlug}--${importKey}--${slugify(label) || "standard"}`.slice(0, 90);
}

export function safeNext(value: string | undefined | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "/";
  return value;
}

export function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStock(input: string) {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const stock = Number(trimmed);
  if (stock > 100000) return null;
  return stock;
}

export function withNotice(path: string, message: string, art: "ok" | "fehler") {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("hinweis", message);
  params.set("art", art);
  return `${pathname}?${params.toString()}`;
}

export function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
