import { baeckerei } from "./baeckerei";
import { blumen } from "./blumen";
import { drogerie } from "./drogerie";
import { fertiggerichte } from "./fertiggerichte";
import { getraenke } from "./getraenke";
import { handwerk } from "./handwerk";
import { lebensmittel } from "./lebensmittel";
import { metzgerei } from "./metzgerei";
import type { IndustryModule } from "./types";

// Eine neue Branche: Moduldatei anlegen und hier eintragen.
// Entdeckung, Warenkorb, Zahlung und Auszahlung bleiben unverändert.
const industries: IndustryModule[] = [
  lebensmittel,
  baeckerei,
  metzgerei,
  getraenke,
  blumen,
  handwerk,
  drogerie,
  fertiggerichte,
];

export function listIndustries() {
  return industries;
}

export function findIndustry(key: string) {
  return industries.find((industry) => industry.key === key) ?? null;
}
