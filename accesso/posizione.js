// Distanza in metri tra due punti (formula dell'emisenoverso)
export function distanza(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
// Dentro la villa se la distanza, tolto il margine di imprecisione del GPS (al massimo 100 m), sta nel raggio.
export function dentro(imp, lat, lon, precisione) {
  if (![lat, lon].every(Number.isFinite)) return { ok: false, dist: null };
  const dist = distanza(imp.lat, imp.lon, lat, lon);
  const margine = Math.min(Number.isFinite(precisione) ? precisione : 0, 100);
  return { ok: dist - margine <= imp.raggio, dist: Math.round(dist) };
}
