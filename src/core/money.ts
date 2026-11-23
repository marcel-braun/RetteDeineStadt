export function parseMinorUnits(input: string): number | null {
  const trimmed = input.trim().replace("€", "").replace(/%/g, "").replace(/\s/g, "");
  if (!trimmed) return null;
  let normalized = trimmed;
  if (trimmed.includes(",") && trimmed.includes(".")) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (trimmed.includes(",")) {
    normalized = trimmed.replace(",", ".");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const major = Number(normalized);
  if (!Number.isFinite(major) || major < 0) return null;
  return Math.round(major * 100);
}

export function formatEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function formatPercent(bps: number) {
  return `${(bps / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} %`;
}

export function minorToInput(minor: number) {
  return (minor / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatKm(km: number) {
  return `${km.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}
