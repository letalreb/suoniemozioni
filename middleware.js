// Accesso con PIN, eseguito da Vercel prima di servire qualsiasi file del sito.
// Nel codice c'è solo l'impronta del PIN, non il PIN. Per cambiarlo senza toccare
// il codice, imposta la variabile d'ambiente SITE_PIN nel progetto Vercel.
import { next } from '@vercel/functions';

export const config = { matcher: ['/((?!favicon\\.svg).*)'] };

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
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
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
