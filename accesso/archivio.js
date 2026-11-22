// Archivio Redis (Upstash, collegato dal Marketplace di Vercel) per impostazioni, PIN e registro degli accessi.
// Se l'archivio non è collegato, il sito funziona come prima: solo PIN, nessun controllo di posizione, nessun registro.
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

// Villa Medici Giulini, via Medici 6, Briosco (coordinate del catasto dei giardini storici APGI)
export const PREDEFINITE = { gps: false, raggio: 300, durata: 4, lat: 45.707128, lon: 9.238169 };
const K = { imp: 'vmg:impostazioni', pin: 'vmg:pin', bypass: 'vmg:bypass', accessi: 'vmg:accessi', nomi: 'vmg:nomi' };
const GIORNI_CONSERVAZIONE = 30;

let cache = { t: 0, v: null };
export async function stato(forza = false) {
  if (!archivioAttivo()) return { attivo: false, imp: { ...PREDEFINITE }, pin: null, bypass: new Set() };
  if (!forza && cache.v && Date.now() - cache.t < 15000) return cache.v;
  try {
    const [imp, pin, bypass] = await redis(['HGETALL', K.imp], ['GET', K.pin], ['SMEMBERS', K.bypass]);
    const m = {};
    for (let i = 0; Array.isArray(imp) && i < imp.length; i += 2) m[imp[i]] = imp[i + 1];
    const v = {
      attivo: true,
      imp: {
        gps: m.gps === '1',
        raggio: Number(m.raggio) || PREDEFINITE.raggio,
        durata: Number(m.durata) || PREDEFINITE.durata,
        lat: Number(m.lat) || PREDEFINITE.lat,
        lon: Number(m.lon) || PREDEFINITE.lon,
      },
      pin: typeof pin === 'string' && /^\d{4,8}$/.test(pin) ? pin : null,
      bypass: new Set(bypass || []),
    };
    cache = { t: Date.now(), v };
    return v;
  } catch {
    return cache.v || { attivo: false, imp: { ...PREDEFINITE }, pin: null, bypass: new Set() };
  }
}
export const svuotaCache = () => { cache = { t: 0, v: null }; };

export async function salvaImpostazioni(imp) {
  const campi = [];
  if (typeof imp.gps === 'boolean') campi.push('gps', imp.gps ? '1' : '0');
  for (const k of ['raggio', 'durata', 'lat', 'lon']) if (Number.isFinite(imp[k])) campi.push(k, String(imp[k]));
  if (campi.length) await redis(['HSET', K.imp, ...campi]);
  svuotaCache();
}
export async function salvaPin(pin) { await redis(['SET', K.pin, pin]); svuotaCache(); }
export async function impostaBypass(dispositivo, consenti, nome) {
  const cmd = [consenti ? ['SADD', K.bypass, dispositivo] : ['SREM', K.bypass, dispositivo]];
  if (typeof nome === 'string') cmd.push(nome.trim() ? ['HSET', K.nomi, dispositivo, nome.trim().slice(0, 40)] : ['HDEL', K.nomi, dispositivo]);
  await redis(...cmd); svuotaCache();
}
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
  const [lista, nomi] = await redis(['ZRANGE', K.accessi, '+inf', '-inf', 'BYSCORE', 'REV', 'LIMIT', '0', String(n)], ['HGETALL', K.nomi]);
  const mn = {};
  for (let i = 0; Array.isArray(nomi) && i < nomi.length; i += 2) mn[nomi[i]] = nomi[i + 1];
  return { accessi: (lista || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean), nomi: mn };
}
export async function cancellaRegistro() { await redis(['DEL', K.accessi]); }
