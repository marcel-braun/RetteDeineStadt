export function formatEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function formatKm(km: number) {
  return `${km.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export function minorToInput(minor: number) {
  return (minor / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
