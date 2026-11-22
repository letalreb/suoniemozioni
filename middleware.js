// Accesso al sito, eseguito da Vercel prima di servire qualsiasi file.
// - PIN obbligatorio; se nell'amministrazione è attivo il controllo della posizione, si entra solo dall'interno della villa
//   (i dispositivi autorizzati senza GPS entrano da ovunque).
// - Ogni tentativo di accesso viene registrato (30 giorni) nell'archivio Redis, se collegato.
// - Lingua: italiano alla radice, inglese sotto /en, scelta dal browser al primo accesso.
// Il PIN sta, in ordine: nell'archivio Redis, in Global Config (ex Edge Config), nella variabile SITE_PIN, o è quello predefinito (qui solo la sua impronta).
import { next } from '@vercel/functions';
import { createClient } from '@vercel/global-config';
import { archivioAttivo, stato, salvaImpostazioni, salvaPin, impostaBypass, registra, elencoAccessi } from './accesso/archivio.js';
import { dentro } from './accesso/posizione.js';
import { COOKIE_SESSIONE, creaSessione, leggiSessione } from './accesso/sessione.js';
import { paginaAccesso } from './accesso/pagina-accesso.js';
import { paginaAdmin, MANIFEST_ADMIN } from './accesso/pagina-admin.js';

export const config = { matcher: ['/((?!favicon\\.svg|favicon\\.ico|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|og\\.png|site\\.webmanifest).*)'] };

const SALE = 'villa-medici-giulini';
const IMPRONTA = 'b123a985827f6a998201fbf8ea6cc7420907238741bbb906334982b7824d7371';
const PIN_PREDEFINITO_VERIFICATO = new Set();
const enc = new TextEncoder();

// ---------- PIN ----------
const CONNESSIONE_GC = () => process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG || '';
const ID_GC = () => process.env.GLOBAL_CONFIG_ID || process.env.EDGE_CONFIG_ID || '';
let clientGC = null;
async function pinGlobalConfig() {
  if (!CONNESSIONE_GC()) return null;
  try {
    clientGC = clientGC || createClient(CONNESSIONE_GC());
    const v = await clientGC.get('pin');
    return typeof v === 'string' && /^\d{4,8}$/.test(v) ? v : null;
  } catch { return null; }
}
/** Il PIN in vigore se è noto in chiaro (archivio, Global Config, SITE_PIN); null se vale quello predefinito. */
async function pinNoto(st) {
  return st.pin || (await pinGlobalConfig()) || process.env.SITE_PIN || null;
}
async function pinValido(pin, st) {
  if (!/^\d{4,8}$/.test(pin)) return false;
  const noto = await pinNoto(st);
  if (noto) return pin === noto;
  if (PIN_PREDEFINITO_VERIFICATO.has(pin)) return true;
  const k = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(SALE), iterations: 150000, hash: 'SHA-256' }, k, 256);
  const ok = [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('') === IMPRONTA;
  if (ok) PIN_PREDEFINITO_VERIFICATO.add(pin);
  return ok;
}
/** Valore del PIN usato per firmare le sessioni: cambia quando cambia il PIN. */
async function firmaPin(st) { return (await pinNoto(st)) || 'predefinito'; }

// ---------- utilità ----------
const json = (s, d, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...h } });
const leggiCookie = (req, nome) => (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + nome + '=([^;]+)'))?.[1];
const pulisci = (v) => String(v || '').trim().replace(/^["']+|["']+$/g, '').trim();
function uguali(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0;
}
function autorizzato(req) {
  const k = pulisci(process.env.PIN_ADMIN_KEY);
  if (!k) return { ok: false, risposta: json(503, { ok: false, messaggio: 'Su Vercel manca la variabile PIN_ADMIN_KEY nell’ambiente Production, oppure non è stato rifatto il deploy dopo averla aggiunta.' }) };
  if (!uguali(pulisci((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')), k)) return { ok: false, risposta: json(401, { ok: false, messaggio: 'Chiave non valida: quella del link non coincide con PIN_ADMIN_KEY su Vercel.' }) };
  return { ok: true };
}
function dispositivoBreve(ua = '') {
  const d = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'altro';
  const b = /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /EdgA?\//.test(ua) ? 'Edge' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : '';
  return b ? `${d}, ${b}` : d;
}
const citta = (req) => { try { return decodeURIComponent(req.headers.get('x-vercel-ip-city') || ''); } catch { return ''; } };
const idDispositivo = (v) => (/^[a-z0-9-]{8,40}$/.test(v || '') ? v : null);
const cookieSessione = (s) => `${COOKIE_SESSIONE}=${s.valore}; Path=/; Max-Age=${s.maxAge}; HttpOnly; Secure; SameSite=Lax`;

// ---------- lingua ----------
const COOKIE_LINGUA = 'vmg_lingua';
function linguaBrowser(req) {
  const prima = (req.headers.get('accept-language') || '').split(',')[0].trim().toLowerCase();
  return !prima || prima.startsWith('it') ? 'it' : 'en';
}
const inInglese = (p) => p === '/en' || p.startsWith('/en/');
const versione = (p, l) => (l === 'en' ? (inInglese(p) ? p : p === '/' ? '/en/' : '/en' + p) : (inInglese(p) ? p.replace(/^\/en(?=\/|$)/, '') || '/' : p));
const ePagina = (p) => !/\.[a-z0-9]{2,5}$/i.test(p) || p.endsWith('.html');
const destSicura = (d) => { d = String(d || '/'); return d.startsWith('/') && !d.startsWith('//') && !d.startsWith('/accesso') && !d.startsWith('/admin') ? d : '/'; };

// ---------- PIN dall'amministrazione o dal comando rapido ----------
async function apiPin(req) {
  const a = autorizzato(req); if (!a.ok) return a.risposta;
  const st = await stato(true);
  if (req.method === 'GET') {
    const p = await pinNoto(st);
    return json(200, { ok: true, pin: p, messaggio: p ? `Il PIN attuale è ${p}.` : 'Il PIN attuale non è salvato: generane uno.' });
  }
  if (req.method !== 'POST') return json(405, { ok: false, messaggio: 'Usa GET o POST.' });
  let pin = '';
  try {
    const tipo = req.headers.get('content-type') || '';
    pin = String(tipo.includes('application/json') ? (await req.json()).pin ?? '' : (await req.formData()).get('pin') ?? '').trim();
  } catch { return json(400, { ok: false, messaggio: 'Richiesta non leggibile.' }); }
  if (!/^\d{4,8}$/.test(pin)) return json(400, { ok: false, messaggio: 'Il PIN deve avere da 4 a 8 cifre.' });
  if (archivioAttivo()) {
    try { await salvaPin(pin); } catch { return json(502, { ok: false, messaggio: 'L’archivio non ha accettato la modifica: riprova tra poco.' }); }
    return json(200, { ok: true, pin, messaggio: `Nuovo PIN attivo: ${pin}. Chi era già entrato dovrà inserirlo di nuovo.` });
  }
  // senza archivio Redis: Global Config come prima
  const mancano = [!CONNESSIONE_GC() && 'l’archivio Upstash Redis oppure lo store Global Config collegato al progetto', CONNESSIONE_GC() && !ID_GC() && 'la variabile EDGE_CONFIG_ID', CONNESSIONE_GC() && !process.env.VERCEL_API_TOKEN && 'la variabile VERCEL_API_TOKEN'].filter(Boolean);
  if (mancano.length) return json(503, { ok: false, messaggio: 'Su Vercel manca ancora: ' + mancano.join('; ') + '. Dopo averle aggiunte rifai il deploy.' });
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : '';
  const r = await fetch(`https://api.vercel.com/v1/edge-config/${ID_GC()}/items${team}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ operation: 'upsert', key: 'pin', value: pin }] }),
  });
  if (!r.ok) return json(502, { ok: false, messaggio: `Vercel ha rifiutato la modifica (${r.status}): controlla VERCEL_API_TOKEN ed EDGE_CONFIG_ID.` });
  return json(200, { ok: true, pin, messaggio: `Nuovo PIN attivo: ${pin}. Chi era già entrato dovrà inserirlo di nuovo.` });
}

// ---------- API dell'amministrazione ----------
async function apiAdmin(req, url) {
  const a = autorizzato(req); if (!a.ok) return a.risposta;
  const st = await stato(true);
  if (url.pathname === '/api/admin/stato') {
    let accessi = [], nomi = {};
    if (st.attivo) { try { ({ accessi, nomi } = await elencoAccessi(300)); } catch { /* vuoto */ } }
    return json(200, { ok: true, archivio: st.attivo, impostazioni: st.imp, pin: await pinNoto(st), bypass: [...st.bypass], nomi, accessi });
  }
  if (req.method !== 'POST') return json(405, { ok: false, messaggio: 'Usa POST.' });
  if (!st.attivo) return json(503, { ok: false, messaggio: 'Collega prima l’archivio Upstash Redis al progetto su Vercel e rifai il deploy.' });
  let d = {}; try { d = await req.json(); } catch { return json(400, { ok: false, messaggio: 'Richiesta non leggibile.' }); }
  if (url.pathname === '/api/admin/impostazioni') {
    const imp = {};
    if (typeof d.gps === 'boolean') imp.gps = d.gps;
    if (Number.isFinite(d.raggio)) { if (d.raggio < 50 || d.raggio > 5000) return json(400, { ok: false, messaggio: 'Il raggio deve essere tra 50 e 5000 metri.' }); imp.raggio = Math.round(d.raggio); }
    if (Number.isFinite(d.durata)) { if (d.durata < 1 || d.durata > 72) return json(400, { ok: false, messaggio: 'La durata deve essere tra 1 e 72 ore.' }); imp.durata = d.durata; }
    if (Number.isFinite(d.lat) && Number.isFinite(d.lon)) {
      if (Math.abs(d.lat) > 90 || Math.abs(d.lon) > 180) return json(400, { ok: false, messaggio: 'Coordinate non valide.' });
      imp.lat = Math.round(d.lat * 1e6) / 1e6; imp.lon = Math.round(d.lon * 1e6) / 1e6;
    }
    await salvaImpostazioni(imp);
    const msg = imp.gps === true ? 'Controllo della posizione attivo: da ora si entra solo dalla villa (chi è già entrato da fuori dovrà rifare l’accesso).' : imp.gps === false ? 'Controllo della posizione spento: si entra da ovunque con il PIN.' : 'Impostazioni salvate.';
    return json(200, { ok: true, messaggio: msg });
  }
  if (url.pathname === '/api/admin/bypass') {
    const dev = idDispositivo(d.dispositivo);
    if (!dev) return json(400, { ok: false, messaggio: 'Dispositivo non valido.' });
    await impostaBypass(dev, !!d.consenti, typeof d.nome === 'string' ? d.nome : undefined);
    return json(200, { ok: true });
  }
  return json(404, { ok: false, messaggio: 'Indirizzo sconosciuto.' });
}

// ---------- accesso ----------
async function tentaAccesso(req, d) {
  const st = await stato();
  const lang = d.lang === 'en' ? 'en' : 'it';
  const dest = destSicura(d.dest);
  const dev = idDispositivo(d.dev) || idDispositivo(leggiCookie(req, 'vmg_dev')) || crypto.randomUUID();
  const lat = Number(d.lat), lon = Number(d.lon), acc = Number(d.acc);
  const conPos = Number.isFinite(lat) && Number.isFinite(lon);
  const voce = { d: dev, ua: dispositivoBreve(req.headers.get('user-agent') || ''), citta: citta(req), lang,
    ...(conPos ? { lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5, acc: Number.isFinite(acc) ? Math.round(acc) : null } : {}) };
  if (!(await pinValido(String(d.pin || '').trim(), st))) {
    await registra({ ...voce, e: 'pin' });
    return { ok: false, errore: 'pin', lang, dest };
  }
  let esito = 'libero', gpsOk = false;
  if (st.imp.gps) {
    if (st.bypass.has(dev)) { esito = 'bypass'; gpsOk = true; }
    else if (!conPos) { await registra({ ...voce, e: 'nogps' }); return { ok: false, errore: 'nogps', lang, dest }; }
    else {
      const r = dentro(st.imp, lat, lon, acc);
      voce.dist = r.dist;
      if (!r.ok) { await registra({ ...voce, e: 'fuori' }); return { ok: false, errore: 'fuori', distanza: r.dist, lang, dest }; }
      esito = 'ok'; gpsOk = true;
    }
  } else if (conPos) {
    voce.dist = dentro(st.imp, lat, lon, acc).dist;
  }
  await registra({ ...voce, e: esito });
  const ore = st.imp.gps ? st.imp.durata : 24 * 30;
  const s = await creaSessione(dev, await firmaPin(st), ore, gpsOk);
  return { ok: true, dest, cookie: cookieSessione(s) };
}

export default async function middleware(req) {
  const url = new URL(req.url);
  const p = url.pathname;

  if (p === '/api/pin' || p === '/api/pin/') return apiPin(req);
  if (p.startsWith('/api/admin/')) return apiAdmin(req, url);
  if (p === '/admin' || p === '/admin/') return paginaAdmin();
  if (p === '/admin/manifest.webmanifest') return new Response(MANIFEST_ADMIN, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-store' } });
  if (p === '/video' || p.startsWith('/video/')) return Response.redirect(new URL('/', url), 301);
  if (p === '/strumenti' || p.startsWith('/strumenti/')) return Response.redirect('https://www.allaricercadeisuoniperduti.com/', 301);

  // invio del PIN (dalla schermata di accesso: JSON con posizione, oppure modulo semplice senza JavaScript)
  if (p === '/accesso' && req.method === 'POST') {
    const tipo = req.headers.get('content-type') || '';
    let d = {};
    try { d = tipo.includes('application/json') ? await req.json() : Object.fromEntries(await req.formData()); } catch { /* vuoto */ }
    const r = await tentaAccesso(req, d);
    if (tipo.includes('application/json')) {
      return r.ok ? json(200, { ok: true, dest: r.dest }, { 'Set-Cookie': r.cookie }) : json(200, { ok: false, errore: r.errore, distanza: r.distanza ?? null });
    }
    if (r.ok) return new Response(null, { status: 303, headers: { Location: r.dest, 'Set-Cookie': r.cookie, 'Cache-Control': 'no-store' } });
    const st = await stato();
    return paginaAccesso({ dest: r.dest, lang: r.lang, errore: r.errore, distanza: r.distanza, gps: st.imp.gps });
  }

  // lingua: scelta esplicita (?lingua=it|en) o lingua del browser al primo accesso
  const sceltaLingua = url.searchParams.get('lingua');
  if (sceltaLingua === 'it' || sceltaLingua === 'en') {
    url.searchParams.delete('lingua');
    return new Response(null, { status: 302, headers: { Location: versione(p, sceltaLingua) + url.search, 'Set-Cookie': `${COOKIE_LINGUA}=${sceltaLingua}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`, 'Cache-Control': 'no-store' } });
  }
  if (req.method === 'GET' && ePagina(p) && p !== '/accesso') {
    const c = leggiCookie(req, COOKIE_LINGUA);
    const voluta = c === 'it' || c === 'en' ? c : linguaBrowser(req) === 'en' ? 'en' : null;
    if (voluta && versione(p, voluta) !== p) return new Response(null, { status: 302, headers: { Location: versione(p, voluta) + url.search, 'Cache-Control': 'no-store', Vary: 'Accept-Language, Cookie' } });
  }

  // controllo della sessione
  const st = await stato();
  const sess = await leggiSessione(leggiCookie(req, COOKIE_SESSIONE), await firmaPin(st));
  const sessOk = sess && (!st.imp.gps || sess.gps || st.bypass.has(sess.dispositivo));
  const vecchioOk = !st.imp.gps && (await (async () => { const v = /^(\d{4,8})$/.exec(leggiCookie(req, 'vmg_pin') || ''); return v ? pinValido(v[1], st) : false; })());

  // PIN nell'indirizzo (QR code): se non serve la posizione entra subito, altrimenti precompila la schermata
  const chiavePin = [...url.searchParams.keys()].find((k) => k.toLowerCase() === 'pin');
  if (chiavePin) {
    const pinUrl = (url.searchParams.get(chiavePin) || '').trim();
    url.searchParams.delete(chiavePin);
    const pulito = p + (url.search || '');
    if (sessOk || vecchioOk) return new Response(null, { status: 302, headers: { Location: pulito, 'Cache-Control': 'no-store' } });
    if (!st.imp.gps) {
      const r = await tentaAccesso(req, { pin: pinUrl, dest: pulito, lang: inInglese(p) ? 'en' : 'it' });
      if (r.ok) return new Response(null, { status: 302, headers: { Location: pulito, 'Set-Cookie': r.cookie, 'Cache-Control': 'no-store' } });
      return paginaAccesso({ dest: pulito, lang: inInglese(p) ? 'en' : 'it', errore: 'pin', gps: false });
    }
    return paginaAccesso({ dest: pulito, lang: inInglese(p) ? 'en' : 'it', gps: true, pin: /^\d{4,8}$/.test(pinUrl) ? pinUrl : '' });
  }

  if (sessOk || vecchioOk) return next();
  if (!ePagina(p)) return new Response('Accesso riservato', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return paginaAccesso({ dest: p + url.search, lang: inInglese(p) ? 'en' : 'it', gps: st.imp.gps });
}
