import type { IndustryModule } from "./industries/types";
import { readAttributes } from "./industries/types";

export type SearchHit = {
  name: string;
  products: { name: string; attributes: unknown }[];
};

export function textHits(name: string, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return name.toLowerCase().includes(needle);
}

// Die Suche kennt keine Branche beim Namen. Sie fragt das Modul, ob die Ware zu den Filtern passt.
export function shopMatchesSearch(shop: SearchHit, industry: IndustryModule | null, query: string, selection: Record<string, string>) {
  const needle = query.trim().toLowerCase();
  const shopNameHits = textHits(shop.name, needle);
  const namedProducts = shop.products.filter((product) => textHits(product.name, needle));
  if (needle && !shopNameHits && namedProducts.length === 0) return false;

  const active = Object.values(selection).some(Boolean);
  if (!industry || !active) return true;

  const pool = needle && !shopNameHits ? namedProducts : shop.products;
  return pool.some((product) => industry.matches(readAttributes(product.attributes), selection));
}
