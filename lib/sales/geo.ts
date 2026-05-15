// Geo helpers shared by the /api/sales/* routes.

/// Distance between two lat/lng points in metres (haversine).
export function distanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000; // Earth radius, metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/// A check-in is "valid" if within this many metres of the lead's saved pin.
export const CHECK_IN_RADIUS_M = 150;

/// Returns true if v is a finite number usable as a coordinate.
export function isCoord(v: unknown): v is number {
  return typeof v === "number" && isFinite(v);
}
