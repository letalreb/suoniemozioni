// Archivio Redis (Upstash, collegato dal Marketplace di Vercel) per il PIN e il registro degli accessi.
// Se l'archivio non è collegato, il sito funziona lo stesso con il PIN, senza registro.
const URL_R = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN_R = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
export const archivioAttivo = () => !!(URL_R() && TOKEN_R());

export async function redis(...comandi) {
  const r = await fetch(URL_R().replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN_R()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(comandi),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error('Redis ' + r.status);
  const out = await r.json();
  return out.map((x) => (x.error ? null : x.result));
}

const K = { pin: 'vmg:pin', accessi: 'vmg:accessi' };
const GIORNI_CONSERVAZIONE = 30;

let cache = { t: 0, v: null };
export async function stato(forza = false) {
  if (!archivioAttivo()) return { attivo: false, pin: null };
  if (!forza && cache.v && Date.now() - cache.t < 15000) return cache.v;
  try {
    const [pin] = await redis(['GET', K.pin]);
    const v = { attivo: true, pin: typeof pin === 'string' && /^\d{4,8}$/.test(pin) ? pin : null };
    cache = { t: Date.now(), v };
    return v;
  } catch {
    return cache.v || { attivo: false, pin: null };
  }
}
export const svuotaCache = () => { cache = { t: 0, v: null }; };
export async function salvaPin(pin) { await redis(['SET', K.pin, pin]); svuotaCache(); }
export async function registra(voce) {
  if (!archivioAttivo()) return;
  const t = Date.now();
  try {
    await redis(
      ['ZADD', K.accessi, String(t), JSON.stringify({ t, ...voce })],
      ['ZREMRANGEBYSCORE', K.accessi, '0', String(t - GIORNI_CONSERVAZIONE * 86400000)],
    );
  } catch { /* il registro non deve mai bloccare l'accesso */ }
}
export async function elencoAccessi(n = 300) {
  const [lista] = await redis(['ZRANGE', K.accessi, '+inf', '-inf', 'BYSCORE', 'REV', 'LIMIT', '0', String(n)]);
  return (lista || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
}
export async function cancellaRegistro() { await redis(['DEL', K.accessi]); }
