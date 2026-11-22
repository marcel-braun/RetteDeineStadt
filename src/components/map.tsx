"use client";

import { useRouter } from "next/navigation";
import { MAP_BOUNDS } from "@/lib/region";

const width = 800;
const height = 620;

function project(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * width;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * height;
  return { x, y };
}

function radiusPx(km: number, lat: number) {
  const kmPerLat = 110.574;
  const kmPerLng = 111.32 * Math.cos((lat * Math.PI) / 180);
  const pxPerKmY = height / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat) / kmPerLat;
  const pxPerKmX = width / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng) / kmPerLng;
  return { rx: km * pxPerKmX, ry: km * pxPerKmY };
}

export function ShopMap({
  shops,
  center,
  radiusKm,
}: {
  shops: { slug: string; name: string; lat: number; lng: number }[];
  center: { lat: number; lng: number };
  radiusKm: number;
}) {
  const router = useRouter();
  const origin = project(center.lat, center.lng);
  const radius = radiusPx(radiusKm, center.lat);

  function chooseCenter(event: React.MouseEvent<SVGSVGElement>) {
    const target = event.target as Element;
    if (target.closest("a")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;
    const lat = MAP_BOUNDS.maxLat - (y / height) * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
    const lng = MAP_BOUNDS.minLng + (x / width) * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
    const params = new URLSearchParams(window.location.search);
    params.set("lat", lat.toFixed(5));
    params.set("lng", lng.toFixed(5));
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="paper map-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Karte der Pilotregion" onClick={chooseCenter}>
        <rect width={width} height={height} fill="#e7f1ea" />
        <path d="M40 430 C 180 390, 260 470, 420 440 S 680 390, 770 450" fill="none" stroke="#c5ddd2" strokeWidth="18" />
        <ellipse cx={origin.x} cy={origin.y} rx={radius.rx} ry={radius.ry} fill="rgba(35,72,59,0.08)" stroke="#23483b" strokeDasharray="6 6" />
        <circle cx={origin.x} cy={origin.y} r="4" fill="#23483b" />
        {shops.map((shop) => {
          const point = project(shop.lat, shop.lng);
          return (
            <a key={shop.slug} href={`/laden/${shop.slug}`}>
              <circle cx={point.x} cy={point.y} r="7" fill="#23483b" />
              <text x={point.x + 12} y={point.y + 4} fontSize="15" fill="#1d1a16" stroke="#f4f1ea" strokeWidth="4" paintOrder="stroke">
                {shop.name}
              </text>
            </a>
          );
        })}
      </svg>
      <p className="map-caption">Maßstäbliche Skizze. Ein Klick setzt den Mittelpunkt des Umkreises.</p>
    </div>
  );
}
