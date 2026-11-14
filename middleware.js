// Accesso con PIN, eseguito da Vercel prima di servire qualsiasi file del sito.
// Nel codice c'è solo l'impronta del PIN, non il PIN. Per cambiarlo senza toccare
// il codice, imposta la variabile d'ambiente SITE_PIN nel progetto Vercel.
import { next } from '@vercel/functions';

export const config = { matcher: ['/((?!favicon\\.svg|favicon\\.ico|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|og\\.png|site\\.webmanifest).*)'] };

const SALE = 'villa-medici-giulini';
const IMPRONTA = 'b123a985827f6a998201fbf8ea6cc7420907238741bbb906334982b7824d7371';
const COOKIE = 'vmg_pin';
const enc = new TextEncoder();
const verificati = new Set();

async function pinValido(pin) {
  if (!/^\d{4,8}$/.test(pin)) return false;
  if (process.env.SITE_PIN) return pin === process.env.SITE_PIN;
  if (verificati.has(pin)) return true;
  const k = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(SALE), iterations: 150000, hash: 'SHA-256' }, k, 256);
  const ok = [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('') === IMPRONTA;
  if (ok) verificati.add(pin);
  return ok;
}

export default async function middleware(req) {
  const url = new URL(req.url);
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
<svg width="88" height="88" aria-hidden="true" style="display:block;margin-bottom:1.4rem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><clipPath id="c"><circle cx="100" cy="100" r="96"/></clipPath></defs><circle cx="100" cy="100" r="96" fill="#1B2A4A"/><g clip-path="url(#c)"><circle cx="100" cy="230" r="170" fill="#22355C" opacity=".5"/><path d="M40,44.8 Q40,48 43.2,48 Q40,48 40,51.2 Q40,48 36.8,48 Q40,48 40,44.8 Z" fill="#F4E9C8"/><path d="M64,28 Q64,30 66,30 Q64,30 64,32 Q64,30 62,30 Q64,30 64,28 Z" fill="#F4E9C8"/><path d="M150,37.4 Q150,40 152.6,40 Q150,40 150,42.6 Q150,40 147.4,40 Q150,40 150,37.4 Z" fill="#F4E9C8"/><path d="M168,68.2 Q168,70 169.8,70 Q168,70 168,71.8 Q168,70 166.2,70 Q168,70 168,68.2 Z" fill="#F4E9C8"/><path d="M120,20.4 Q120,22 121.6,22 Q120,22 120,23.6 Q120,22 118.4,22 Q120,22 120,20.4 Z" fill="#F4E9C8"/><path d="M30,80.5 Q30,82 31.5,82 Q30,82 30,83.5 Q30,82 28.5,82 Q30,82 30,80.5 Z" fill="#F4E9C8"/><rect x="59" y="72" width="82" height="96" fill="#E6B85C"/><rect x="59" y="72" width="6" height="96" fill="#C4913F" opacity=".55"/><rect x="54" y="63" width="92" height="9" fill="#F4DC9C"/><rect x="54" y="63" width="92" height="2.4" fill="#FFF1C9"/><rect x="62" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="68" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="74" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="80" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="86" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="92" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="98" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="104" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="110" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="116" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="122" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="128" y="72" width="2.6" height="3" fill="#C4913F"/><rect x="134" y="72" width="2.6" height="3" fill="#C4913F"/><path d="M55.0,63 h8.0 v-2.2 h-8.0 Z M57.4,60.8 h3.2 l0.8,-2.0 C65.2,57.5 64.6,52.5 61.2,51.2 h-4.4 C53.4,52.5 52.8,57.5 56.6,58.8 Z M56.0,51.2 h6.0 l-0.9,-1.6 h-4.2 Z M59,45.4 C60.8,47.4 60.6,49.6 59,49.6 C57.4,49.6 57.2,47.4 59,45.4 Z" fill="#F4DC9C"/><path d="M137.0,63 h8.0 v-2.2 h-8.0 Z M139.4,60.8 h3.2 l0.8,-2.0 C147.2,57.5 146.6,52.5 143.2,51.2 h-4.4 C135.4,52.5 134.8,57.5 138.6,58.8 Z M138.0,51.2 h6.0 l-0.9,-1.6 h-4.2 Z M141,45.4 C142.8,47.4 142.6,49.6 141,49.6 C139.4,49.6 139.2,47.4 141,45.4 Z" fill="#F4DC9C"/><rect x="71" y="86" width="20" height="26" fill="#F4DC9C"/><rect x="73" y="88" width="16" height="22" fill="#2A2418"/><rect x="80.4" y="88" width="1.2" height="22" fill="#F4DC9C"/><rect x="69" y="82.5" width="24" height="2.2" fill="#F4DC9C"/><rect x="109" y="86" width="20" height="26" fill="#F4DC9C"/><rect x="111" y="88" width="16" height="22" fill="#2A2418"/><rect x="118.4" y="88" width="1.2" height="22" fill="#F4DC9C"/><rect x="107" y="82.5" width="24" height="2.2" fill="#F4DC9C"/><rect x="71" y="128" width="20" height="24" fill="#F4DC9C"/><rect x="73" y="130" width="16" height="20" fill="#2A2418"/><rect x="80.4" y="130" width="1.2" height="20" fill="#F4DC9C"/><rect x="69" y="124.5" width="24" height="2.2" fill="#F4DC9C"/><rect x="109" y="128" width="20" height="24" fill="#F4DC9C"/><rect x="111" y="130" width="16" height="20" fill="#2A2418"/><rect x="118.4" y="130" width="1.2" height="20" fill="#F4DC9C"/><rect x="107" y="124.5" width="24" height="2.2" fill="#F4DC9C"/><rect x="93" y="127" width="14" height="41" fill="#F4DC9C"/><rect x="95.5" y="130" width="9" height="38" fill="#2A2418"/><path d="M0,160 C30,153 60,156 90,158 C120,160 160,152 200,158 V200 H0 Z" fill="#1E3326"/></g></svg>
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
