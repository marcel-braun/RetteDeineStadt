export function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earth = 6371;
  const lat = ((to.lat - from.lat) * Math.PI) / 180;
  const lng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(lat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(lng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(a));
}
