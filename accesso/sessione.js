// Sessione firmata: dispositivo.scadenza.posizione-verificata.firma
// La firma include il PIN attuale: cambiando PIN, tutte le sessioni decadono.
const enc = new TextEncoder();
const chiave = () => process.env.PIN_ADMIN_KEY || 'villa-medici-giulini';
async function hmac(testo) {
  const k = await crypto.subtle.importKey('raw', enc.encode(chiave()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, enc.encode(testo));
  return [...new Uint8Array(s)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 40);
}
export const COOKIE_SESSIONE = 'vmg_s';
export async function creaSessione(dispositivo, pin, ore, gpsVerificato) {
  const scad = Math.floor(Date.now() / 1000) + Math.round(ore * 3600);
  const g = gpsVerificato ? '1' : '0';
  return { valore: `${dispositivo}.${scad}.${g}.${await hmac(`${dispositivo}.${scad}.${g}.${pin}`)}`, maxAge: Math.round(ore * 3600) };
}
export async function leggiSessione(valore, pin) {
  const m = /^([a-z0-9-]{8,40})\.(\d{10})\.([01])\.([a-f0-9]{40})$/.exec(valore || '');
  if (!m) return null;
  const [, dispositivo, scad, g, firma] = m;
  if (Number(scad) < Date.now() / 1000) return null;
  if ((await hmac(`${dispositivo}.${scad}.${g}.${pin}`)) !== firma) return null;
  return { dispositivo, gps: g === '1' };
}
