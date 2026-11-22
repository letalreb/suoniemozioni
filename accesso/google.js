// Accesso all'amministrazione con Google: verifica del token firmato da Google (Google Identity Services)
// e sessione di amministrazione firmata dal sito.
const enc = new TextEncoder();
let chiaviGoogle = { t: 0, keys: [] };
const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

async function certificati() {
  if (chiaviGoogle.keys.length && Date.now() - chiaviGoogle.t < 3600000) return chiaviGoogle.keys;
  const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!r.ok) throw new Error('certificati Google ' + r.status);
  chiaviGoogle = { t: Date.now(), keys: (await r.json()).keys || [] };
  return chiaviGoogle.keys;
}

/** Restituisce l'email verificata se il token è valido per questo sito, altrimenti null. */
export async function verificaTokenGoogle(token, clientId) {
  const parti = String(token || '').split('.');
  if (parti.length !== 3 || !clientId) return null;
  let head, dati;
  try { head = JSON.parse(new TextDecoder().decode(b64url(parti[0]))); dati = JSON.parse(new TextDecoder().decode(b64url(parti[1]))); } catch { return null; }
  if (head.alg !== 'RS256') return null;
  const jwk = (await certificati()).find((k) => k.kid === head.kid);
  if (!jwk) return null;
  const chiave = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', chiave, b64url(parti[2]), enc.encode(parti[0] + '.' + parti[1]));
  if (!ok) return null;
  const ora = Date.now() / 1000;
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(dati.iss)) return null;
  if (dati.aud !== clientId || !(dati.exp > ora) || dati.email_verified !== true || !dati.email) return null;
  return { email: String(dati.email).toLowerCase(), nome: dati.name || '' };
}

// Sessione di amministrazione: email.scadenza.firma (8 ore)
export const COOKIE_ADMIN = 'vmg_admin';
const segreto = () => process.env.PIN_ADMIN_KEY || process.env.ADMIN_SECRET || '';
async function firma(testo) {
  const k = await crypto.subtle.importKey('raw', enc.encode(segreto()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode('admin:' + testo)))].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export async function creaSessioneAdmin(email, ore = 8) {
  const scad = Math.floor(Date.now() / 1000) + ore * 3600;
  const e = btoa(email).replace(/=+$/, '');
  return { valore: `${e}.${scad}.${await firma(`${e}.${scad}`)}`, maxAge: ore * 3600 };
}
export async function leggiSessioneAdmin(valore) {
  const m = /^([A-Za-z0-9+/]+)\.(\d{10})\.([a-f0-9]{64})$/.exec(valore || '');
  if (!m || !segreto() || Number(m[2]) < Date.now() / 1000) return null;
  if ((await firma(`${m[1]}.${m[2]}`)) !== m[3]) return null;
  try { return atob(m[1]); } catch { return null; }
}
// Amministratori autorizzati. La variabile ADMIN_EMAILS su Vercel, se presente, sostituisce questo elenco.
const AMMINISTRATORI = ['letalreb@gmail.com', 'info.villamedici@gmail.com'];
export const emailAmmesse = () => (process.env.ADMIN_EMAILS ? String(process.env.ADMIN_EMAILS) : AMMINISTRATORI.join(',')).toLowerCase().split(/[\s,;]+/).filter(Boolean);
