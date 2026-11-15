// Accesso con PIN, eseguito da Vercel prima di servire qualsiasi file del sito.
// Dove sta il PIN, in ordine di priorità:
//   1. Edge Config di Vercel, voce "pin": si cambia al volo dal comando rapido dell'iPhone (POST /api/pin)
//   2. variabile d'ambiente SITE_PIN
//   3. il PIN predefinito, di cui qui c'è solo l'impronta
import { next } from '@vercel/functions';
import { get } from '@vercel/edge-config';

export const config = { matcher: ['/((?!favicon\\.svg|favicon\\.ico|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|og\\.png|site\\.webmanifest).*)'] };

const SALE = 'villa-medici-giulini';
const IMPRONTA = 'b123a985827f6a998201fbf8ea6cc7420907238741bbb906334982b7824d7371';
const COOKIE = 'vmg_pin';
const enc = new TextEncoder();
const verificati = new Set();

async function pinCorrente() {
  if (!process.env.EDGE_CONFIG) return null;
  try {
    const v = await get('pin');
    return typeof v === 'string' && /^\d{4,8}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

async function pinValido(pin) {
  if (!/^\d{4,8}$/.test(pin)) return false;
  const dinamico = await pinCorrente();
  if (dinamico) return pin === dinamico;
  if (process.env.SITE_PIN) return pin === process.env.SITE_PIN;
  if (verificati.has(pin)) return true;
  const k = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(SALE), iterations: 150000, hash: 'SHA-256' }, k, 256);
  const ok = [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('') === IMPRONTA;
  if (ok) verificati.add(pin);
  return ok;
}

const json = (stato, dati) => new Response(JSON.stringify(dati), { status: stato, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

function uguali(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// Comando rapido dell'iPhone: GET legge il PIN attuale, POST {"pin":"1234"} lo cambia.
async function apiPin(req) {
  const chiave = process.env.PIN_ADMIN_KEY;
  const data = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!chiave || !uguali(data, chiave)) return json(401, { ok: false, messaggio: 'Chiave non valida.' });
  if (!process.env.EDGE_CONFIG || !process.env.EDGE_CONFIG_ID || !process.env.VERCEL_API_TOKEN) {
    return json(503, { ok: false, messaggio: 'Edge Config non ancora configurato su Vercel.' });
  }
  if (req.method === 'GET') {
    const p = await pinCorrente();
    return json(200, { ok: true, pin: p, messaggio: p ? `Il PIN attuale è ${p}.` : 'Nessun PIN impostato in Edge Config.' });
  }
  if (req.method !== 'POST') return json(405, { ok: false, messaggio: 'Usa GET o POST.' });
  let pin = '';
  try {
    const tipo = req.headers.get('content-type') || '';
    if (tipo.includes('application/json')) pin = String((await req.json()).pin ?? '');
    else pin = String((await req.formData()).get('pin') ?? '');
  } catch {
    return json(400, { ok: false, messaggio: 'Richiesta non leggibile.' });
  }
  pin = pin.trim();
  if (!/^\d{4,8}$/.test(pin)) return json(400, { ok: false, messaggio: 'Il PIN deve avere da 4 a 8 cifre.' });
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : '';
  const r = await fetch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items${team}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ operation: 'upsert', key: 'pin', value: pin }] }),
  });
  if (!r.ok) return json(502, { ok: false, messaggio: `Vercel ha rifiutato la modifica (${r.status}).` });
  return json(200, { ok: true, pin, messaggio: `Nuovo PIN attivo: ${pin}. Chi era già entrato dovrà inserirlo di nuovo.` });
}

export default async function middleware(req) {
  const url = new URL(req.url);
  if (url.pathname === '/api/pin' || url.pathname === '/api/pin/') return apiPin(req);
  if (url.pathname === '/video' || url.pathname.startsWith('/video/')) {
    return Response.redirect(new URL('/', url), 301);
  }
  if (url.pathname === '/strumenti' || url.pathname.startsWith('/strumenti/')) {
    return Response.redirect('https://www.allaricercadeisuoniperduti.com/', 301);
  }
  if (url.pathname === '/accesso' && req.method === 'POST') {
    const dati = await req.formData();
    const pin = String(dati.get('pin') || '').trim();
    let dest = String(dati.get('dest') || '/');
    if (!dest.startsWith('/') || dest.startsWith('//') || dest.startsWith('/accesso')) dest = '/';
    if (await pinValido(pin)) {
      return new Response(null, { status: 303, headers: {
        Location: dest,
        'Set-Cookie': `${COOKIE}=${pin}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store',
      } });
    }
    return pagina(dest, true);
  }
  // PIN nell'indirizzo (?PIN=… dai QR code in sala): salva il cookie e ricarica la pagina senza parametro.
  const chiave = [...url.searchParams.keys()].find((k) => k.toLowerCase() === 'pin');
  if (chiave) {
    const pin = (url.searchParams.get(chiave) || '').trim();
    url.searchParams.delete(chiave);
    const pulito = url.pathname + (url.search || '');
    if (await pinValido(pin)) {
      return new Response(null, { status: 302, headers: {
        Location: pulito,
        'Set-Cookie': `${COOKIE}=${pin}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store',
      } });
    }
    return pagina(pulito, true);
  }
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)vmg_pin=(\d{4,8})/);
  if (m && (await pinValido(m[1]))) return next();
  return pagina(url.pathname + url.search, false);
}

function pagina(dest, errore) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex"><title>Accesso | Suoni ed emozioni</title>
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,400&family=Hanken+Grotesk:wght@400;600&display=swap">
<style>
:root{--carta:#EDEFEA;--ink:#1D2420;--tenue:#56605A;--filo:#C6CEC4;--err:#9B2C2C;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--carta:#141814;--ink:#E8ECE4;--tenue:#A3ACA4;--filo:#323A32;--err:#F0A3A3;color-scheme:dark}}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;display:grid;place-items:center;background:var(--carta);color:var(--ink);font:400 1.05rem/1.55 'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;padding:env(safe-area-inset-top,0) 1.2rem env(safe-area-inset-bottom,0)}
main{width:min(26rem,100%)}
h1{font:italic 400 clamp(2.4rem,9vw,3.4rem)/1 'Bodoni Moda','Bodoni 72',Didot,serif;margin:0 0 .8rem}
p{color:var(--tenue);margin:0 0 1.6rem}
label{display:block;font-weight:600;margin-bottom:.4rem}
.riga{display:flex;gap:.5rem}
input{flex:1;min-width:0;height:3.2rem;padding:0 1rem;font:600 1.4rem/1 inherit;letter-spacing:.3em;color:inherit;background:transparent;border:1px solid var(--ink);border-radius:2px}
button{height:3.2rem;padding:0 1.3rem;font:600 1rem inherit;border:0;border-radius:2px;background:var(--ink);color:var(--carta);cursor:pointer}
:focus-visible{outline:2px solid #2457C5;outline-offset:3px}
.err{color:var(--err);margin:.8rem 0 0}
</style></head><body><main>
<svg width="80" height="80" aria-hidden="true" style="display:block;margin-bottom:1.4rem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="30" fill="#22382D"/><g transform="translate(14 8) scale(.825)"><g fill="none" stroke="#F4EFE3" stroke-width="3.4" stroke-linejoin="miter"><path d="M30,150 V64 H130 V150"/><path d="M24,56 H136 M27,64 H133 M24,56 L27,64 M136,56 L133,64"/><rect x="45" y="78" width="18" height="26"/><rect x="97" y="78" width="18" height="26"/><path d="M41,73 H67 M93,73 H119"/><rect x="45" y="116" width="18" height="24"/><rect x="97" y="116" width="18" height="24"/><path d="M71,150 V114 H89 V150 M68,109 H92"/><path d="M16,150 H144"/></g><g fill="#F4EFE3" stroke="none"><rect x="25.5" y="53.5" width="9.0" height="2.5"/><rect x="28.5" y="51.5" width="3.0" height="2.25"/><ellipse cx="30" cy="47.75" rx="4.25" ry="4.0"/><rect x="28.12" y="42.75" width="3.75" height="2.0"/><rect x="26.75" y="41.5" width="6.5" height="1.5"/><circle cx="30" cy="39.879999999999995" r="1.38"/></g><g fill="#F4EFE3" stroke="none"><rect x="125.5" y="53.5" width="9.0" height="2.5"/><rect x="128.5" y="51.5" width="3.0" height="2.25"/><ellipse cx="130" cy="47.75" rx="4.25" ry="4.0"/><rect x="128.12" y="42.75" width="3.75" height="2.0"/><rect x="126.75" y="41.5" width="6.5" height="1.5"/><circle cx="130" cy="39.879999999999995" r="1.38"/></g></g></svg>
<h1>Suoni ed emozioni</h1>
<p>Invito all’arte e alla musica a Villa Medici Giulini. Il sito è in anteprima. Scrivi il PIN che ti è stato comunicato per entrare.</p>
<form method="post" action="/accesso">
<label for="pin">PIN</label>
<div class="riga"><input id="pin" name="pin" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{4,8}" required autofocus ${errore ? 'aria-describedby="err" aria-invalid="true"' : ''}>
<button type="submit">Entra</button></div>
<input type="hidden" name="dest" value="${esc(dest)}">
${errore ? '<p class="err" id="err" role="alert">PIN non corretto. Controlla le cifre e riprova.</p>' : ''}
</form></main></body></html>`;
  return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
