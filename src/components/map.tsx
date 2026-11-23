"use client";

import { useRouter } from "next/navigation";

const width = 800;
const height = 620;

type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number };

function project(lat: number, lng: number, bounds: Bounds) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
  return { x, y };
}

function radiusPx(km: number, lat: number, bounds: Bounds) {
  const kmPerLat = 110.574;
  const kmPerLng = 111.32 * Math.cos((lat * Math.PI) / 180);
  const pxPerKmY = height / (bounds.maxLat - bounds.minLat) / kmPerLat;
  const pxPerKmX = width / (bounds.maxLng - bounds.minLng) / kmPerLng;
  return { rx: km * pxPerKmX, ry: km * pxPerKmY };
}

export function ShopMap({
  shops,
  center,
  radiusKm,
  bounds,
}: {
  shops: { slug: string; name: string; lat: number; lng: number }[];
  center: { lat: number; lng: number };
  radiusKm: number;
  bounds: Bounds;
}) {
  const router = useRouter();
  const origin = project(center.lat, center.lng, bounds);
  const radius = radiusPx(radiusKm, center.lat, bounds);

  function chooseCenter(event: React.MouseEvent<SVGSVGElement>) {
    const target = event.target as Element;
    if (target.closest("a")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;
    const lat = bounds.maxLat - (y / height) * (bounds.maxLat - bounds.minLat);
    const lng = bounds.minLng + (x / width) * (bounds.maxLng - bounds.minLng);
    const params = new URLSearchParams(window.location.search);
    params.set("lat", lat.toFixed(5));
    params.set("lng", lng.toFixed(5));
    router.push(`/entdecken?${params.toString()}`);
  }

  return (
    <div className="paper map-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Karte der Pilotregion" onClick={chooseCenter}>
        <rect width={width} height={height} fill="#efe4cf" />
        <path d="M30 470 C 160 400, 250 500, 410 450 S 640 390, 780 470" fill="none" stroke="#c9b28a" strokeWidth="22" />
        <path d="M30 470 C 160 400, 250 500, 410 450 S 640 390, 780 470" fill="none" stroke="#d7e4dc" strokeWidth="8" />
        <ellipse cx={origin.x} cy={origin.y} rx={radius.rx} ry={radius.ry} fill="rgba(36, 78, 58, 0.12)" stroke="#244e3a" strokeDasharray="7 6" />
        <circle cx={origin.x} cy={origin.y} r="5" fill="#8c4a32" />
        {shops.map((shop) => {
          const point = project(shop.lat, shop.lng, bounds);
          return (
            <a key={shop.slug} href={`/laden/${shop.slug}`}>
              <circle cx={point.x} cy={point.y} r="8" fill="#244e3a" />
              <text x={point.x + 12} y={point.y + 4} fontSize="16" fill="#241c16" stroke="#f6efe4" strokeWidth="4" paintOrder="stroke">
                {shop.name}
              </text>
            </a>
          );
        })}
      </svg>
      <p className="map-caption">Ein Klick setzt den Mittelpunkt. Die Entfernung steht an jedem Laden.</p>
    </div>
  );
}
