// Accesso al sito, eseguito da Vercel prima di servire qualsiasi file.
// - Si entra solo con il PIN; ogni tentativo viene registrato (30 giorni) nell'archivio Redis, se collegato.
// - L'amministrazione (/admin, solo in italiano) si apre con un account Google autorizzato (elenco in accesso/google.js o variabile ADMIN_EMAILS).
// - Lingua: italiano alla radice, inglese sotto /en, scelta dal browser al primo accesso.
// Il PIN sta, in ordine: nell'archivio Redis, in Global Config (ex Edge Config), nella variabile SITE_PIN, o è quello predefinito (qui solo la sua impronta).
import { next } from '@vercel/functions';
import { createClient } from '@vercel/global-config';
import { archivioAttivo, stato, salvaPin, registra, elencoAccessi } from './accesso/archivio.js';
import { verificaTokenGoogle, creaSessioneAdmin, leggiSessioneAdmin, emailAmmesse, COOKIE_ADMIN } from './accesso/google.js';
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
/** Amministratore: sessione Google valida per un indirizzo autorizzato, oppure chiave PIN_ADMIN_KEY (comando rapido dell'iPhone). */
async function autorizzato(req) {
  const email = await leggiSessioneAdmin(leggiCookie(req, COOKIE_ADMIN));
  if (email && emailAmmesse().includes(email)) return { ok: true, utente: email };
  const k = pulisci(process.env.PIN_ADMIN_KEY);
  const data = pulisci((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
  if (k && data && uguali(data, k)) return { ok: true, utente: 'chiave del comando rapido' };
  return { ok: false, risposta: json(401, { ok: false, messaggio: 'Accedi con un account Google autorizzato.' }) };
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
  const a = await autorizzato(req); if (!a.ok) return a.risposta;
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
const cookieAdmin = (v, maxAge) => `${COOKIE_ADMIN}=${v}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
async function apiAdmin(req, url) {
  if (url.pathname === '/api/admin/login' && req.method === 'POST') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return json(503, { ok: false, messaggio: 'Su Vercel manca GOOGLE_CLIENT_ID: aggiungila e rifai il deploy.' });
    if (!process.env.PIN_ADMIN_KEY && !process.env.ADMIN_SECRET) return json(503, { ok: false, messaggio: 'Su Vercel manca PIN_ADMIN_KEY, che serve a firmare la sessione di amministrazione.' });
    let d = {}; try { d = await req.json(); } catch { /* vuoto */ }
    let utente = null; try { utente = await verificaTokenGoogle(d.credential, clientId); } catch { /* certificati non raggiungibili */ }
    if (!utente) return json(401, { ok: false, messaggio: 'Accesso con Google non riuscito: riprova.' });
    if (!emailAmmesse().includes(utente.email)) return json(403, { ok: false, messaggio: `L’account ${utente.email} non è autorizzato all’amministrazione.` });
    const s = await creaSessioneAdmin(utente.email);
    return json(200, { ok: true, utente: utente.email }, { 'Set-Cookie': cookieAdmin(s.valore, s.maxAge) });
  }
  if (url.pathname === '/api/admin/logout') return json(200, { ok: true }, { 'Set-Cookie': cookieAdmin('', 0) });
  const a = await autorizzato(req); if (!a.ok) return a.risposta;
  if (url.pathname === '/api/admin/stato') {
    const st = await stato(true);
    let accessi = [];
    if (st.attivo) { try { accessi = await elencoAccessi(300); } catch { /* vuoto */ } }
    return json(200, { ok: true, utente: a.utente, archivio: st.attivo, pin: await pinNoto(st), accessi });
  }
  return json(404, { ok: false, messaggio: 'Indirizzo sconosciuto.' });
}

// ---------- accesso ----------
async function tentaAccesso(req, d) {
  const st = await stato();
  const lang = d.lang === 'en' ? 'en' : 'it';
  const dest = destSicura(d.dest);
  const dev = idDispositivo(d.dev) || crypto.randomUUID();
  const voce = { d: dev, ua: dispositivoBreve(req.headers.get('user-agent') || ''), citta: citta(req), lang };
  if (!(await pinValido(String(d.pin || '').trim(), st))) {
    await registra({ ...voce, e: 'pin' });
    return { ok: false, errore: 'pin', lang, dest };
  }
  await registra({ ...voce, e: 'libero' });
  const s = await creaSessione(dev, await firmaPin(st), 24 * 30, false);
  return { ok: true, dest, cookie: cookieSessione(s) };
}

export default async function middleware(req) {
  const url = new URL(req.url);
  const p = url.pathname;

  if (p === '/api/pin' || p === '/api/pin/') return apiPin(req);
  if (p.startsWith('/api/admin/')) return apiAdmin(req, url);
  if (p === '/admin' || p === '/admin/') return paginaAdmin(process.env.GOOGLE_CLIENT_ID);
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
      return r.ok ? json(200, { ok: true, dest: r.dest }, { 'Set-Cookie': r.cookie }) : json(200, { ok: false, errore: r.errore });
    }
    if (r.ok) return new Response(null, { status: 303, headers: { Location: r.dest, 'Set-Cookie': r.cookie, 'Cache-Control': 'no-store' } });
    return paginaAccesso({ dest: r.dest, lang: r.lang, errore: r.errore });
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
  const sessOk = !!(await leggiSessione(leggiCookie(req, COOKIE_SESSIONE), await firmaPin(st)));
  const vecchioOk = !sessOk && (await (async () => { const v = /^(\d{4,8})$/.exec(leggiCookie(req, 'vmg_pin') || ''); return v ? pinValido(v[1], st) : false; })());

  // PIN nell'indirizzo (vecchi QR code): entra subito e toglie il PIN dalla barra degli indirizzi
  const chiavePin = [...url.searchParams.keys()].find((k) => k.toLowerCase() === 'pin');
  if (chiavePin) {
    const pinUrl = (url.searchParams.get(chiavePin) || '').trim();
    url.searchParams.delete(chiavePin);
    const pulito = p + (url.search || '');
    const lang = inInglese(p) ? 'en' : 'it';
    if (sessOk || vecchioOk) return new Response(null, { status: 302, headers: { Location: pulito, 'Cache-Control': 'no-store' } });
    const r = await tentaAccesso(req, { pin: pinUrl, dest: pulito, lang });
    if (r.ok) return new Response(null, { status: 302, headers: { Location: pulito, 'Set-Cookie': r.cookie, 'Cache-Control': 'no-store' } });
    return paginaAccesso({ dest: pulito, lang, errore: 'pin' });
  }

  if (sessOk || vecchioOk) return next();
  if (!ePagina(p)) return new Response('Accesso riservato', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return paginaAccesso({ dest: p + url.search, lang: inInglese(p) ? 'en' : 'it' });
}
