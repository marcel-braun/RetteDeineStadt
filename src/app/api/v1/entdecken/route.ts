import { discover } from "@/core/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters: Record<string, string> = {};
  for (const [key, value] of url.searchParams) {
    if (key.startsWith("f_") && value) filters[key.slice(2)] = value;
  }
  const result = await discover({
    q: url.searchParams.get("q") ?? "",
    km: optionalNumber(url.searchParams.get("km")),
    lat: optionalNumber(url.searchParams.get("lat")),
    lng: optionalNumber(url.searchParams.get("lng")),
    zoneKey: url.searchParams.get("zone") ?? "",
    industryKey: url.searchParams.get("branche") ?? "",
    filters,
  });
  return Response.json(result);
}

function optionalNumber(value: string | null) {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
