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
<svg width="72" height="72" aria-hidden="true" style="display:block;margin-bottom:1.4rem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96.0" fill="#22382D"/><rect x="61.44" y="166.27" width="389.12" height="5.38" fill="#C2A162"/><rect x="61.44" y="209.79" width="389.12" height="5.38" fill="#C2A162"/><rect x="61.44" y="253.31" width="389.12" height="5.38" fill="#C2A162"/><rect x="61.44" y="296.83" width="389.12" height="5.38" fill="#C2A162"/><rect x="61.44" y="340.35" width="389.12" height="5.38" fill="#C2A162"/><path fill="#F3EFE4" stroke="#22382D" stroke-width="51.7" stroke-linejoin="round" paint-order="stroke" transform="translate(129.33 418.42) scale(0.21801 -0.21801)" d="M479 -30Q362 -30 283.0 4.0Q204 38 156.5 98.5Q109 159 86.0 238.0Q63 317 57 407H61Q67 318 89.5 240.0Q112 162 159.0 102.5Q206 43 283.5 9.0Q361 -25 476 -25Q580 -25 663.5 16.5Q747 58 796.0 131.5Q845 205 845 302Q845 392 811.5 453.5Q778 515 723.5 558.0Q669 601 603.5 635.5Q538 670 473.0 705.5Q408 741 353.0 786.5Q298 832 265.0 897.5Q232 963 232 1059Q232 1174 280.0 1260.0Q328 1346 403.5 1404.0Q479 1462 563.5 1491.0Q648 1520 720 1520Q848 1520 933.0 1469.0Q1018 1418 1061.5 1324.0Q1105 1230 1110 1099H1106Q1101 1228 1058.0 1321.0Q1015 1414 931.5 1464.5Q848 1515 723 1515Q648 1515 578.0 1481.5Q508 1448 462.5 1386.0Q417 1324 417 1238Q417 1157 450.0 1103.5Q483 1050 538.0 1011.5Q593 973 658.5 940.0Q724 907 789.5 869.5Q855 832 910.0 779.0Q965 726 998.0 648.5Q1031 571 1031 457Q1031 352 986.5 263.0Q942 174 865.0 108.5Q788 43 688.5 6.5Q589 -30 479 -30ZM-41 -20 57 407H61L67 326Q79 265 96.0 217.0Q113 169 138 131L-37 -20ZM1106 1099V1147Q1097 1204 1082.5 1261.0Q1068 1318 1028 1379L1199 1520H1203L1110 1099Z"/></svg>
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
