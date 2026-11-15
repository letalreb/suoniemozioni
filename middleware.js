// Accesso con PIN, eseguito da Vercel prima di servire qualsiasi file del sito.
// Dove sta il PIN, in ordine di priorità:
//   1. Global Config di Vercel (ex Edge Config), voce "pin": si cambia al volo da /admin o dal comando rapido (POST /api/pin)
//   2. variabile d'ambiente SITE_PIN
//   3. il PIN predefinito, di cui qui c'è solo l'impronta
import { next } from '@vercel/functions';
import { createClient } from '@vercel/global-config';

export const config = { matcher: ['/((?!favicon\\.svg|favicon\\.ico|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|og\\.png|site\\.webmanifest).*)'] };

const SALE = 'villa-medici-giulini';
const IMPRONTA = 'b123a985827f6a998201fbf8ea6cc7420907238741bbb906334982b7824d7371';
const COOKIE = 'vmg_pin';
const enc = new TextEncoder();
const verificati = new Set();

// Vercel crea GLOBAL_CONFIG quando colleghi lo store al progetto (EDGE_CONFIG per gli store creati prima del cambio di nome).
const CONNESSIONE = () => process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG || '';
const ID_STORE = () => process.env.GLOBAL_CONFIG_ID || process.env.EDGE_CONFIG_ID || '';
let client = null;
async function pinCorrente() {
  if (!CONNESSIONE()) return null;
  try {
    client = client || createClient(CONNESSIONE());
    const v = await client.get('pin');
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
  // tolgo spazi, a capo e virgolette eventualmente incollati insieme alla chiave
  const pulisci = (v) => String(v || '').trim().replace(/^["']+|["']+$/g, '').trim();
  const chiave = pulisci(process.env.PIN_ADMIN_KEY);
  const data = pulisci((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
  if (!chiave) return json(503, { ok: false, messaggio: 'Su Vercel manca la variabile PIN_ADMIN_KEY nell’ambiente Production, oppure non è stato rifatto il deploy dopo averla aggiunta.' });
  if (!uguali(data, chiave)) return json(401, { ok: false, messaggio: 'Chiave non valida: quella del link non coincide con PIN_ADMIN_KEY su Vercel.' });
  const mancano = [!CONNESSIONE() && 'lo store Global Config collegato al progetto (variabile GLOBAL_CONFIG)', !ID_STORE() && 'la variabile EDGE_CONFIG_ID', !process.env.VERCEL_API_TOKEN && 'la variabile VERCEL_API_TOKEN'].filter(Boolean);
  if (mancano.length) return json(503, { ok: false, messaggio: 'Su Vercel manca ancora: ' + mancano.join('; ') + '. Dopo averle aggiunte rifai il deploy.' });
  if (req.method === 'GET') {
    const p = await pinCorrente();
    return json(200, { ok: true, pin: p, messaggio: p ? `Il PIN attuale è ${p}.` : 'Nello store non c’è ancora la voce «pin»: generane uno con il pulsante qui sotto.' });
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
  const r = await fetch(`https://api.vercel.com/v1/edge-config/${ID_STORE()}/items${team}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ operation: 'upsert', key: 'pin', value: pin }] }),
  });
  if (!r.ok) {
    let dettaglio = '';
    try { const e = await r.json(); dettaglio = e?.error?.message || e?.error?.code || ''; } catch {}
    const motivo = r.status === 403 || r.status === 401 ? 'controlla VERCEL_API_TOKEN e, se il progetto è in un team, VERCEL_TEAM_ID' : r.status === 404 ? 'controlla EDGE_CONFIG_ID' : 'riprova tra poco';
    return json(502, { ok: false, messaggio: `Vercel ha rifiutato la modifica (${r.status}${dettaglio ? ': ' + dettaglio : ''}): ${motivo}.` });
  }
  return json(200, { ok: true, pin, messaggio: `Nuovo PIN attivo: ${pin}. Chi era già entrato dovrà inserirlo di nuovo.` });
}


// Pagina riservata per cambiare il PIN dal telefono (Android, iPhone, computer).
// La chiave arriva nel link dopo il # (il server non la vede mai) e resta salvata sul dispositivo.
const MANIFEST_ADMIN = JSON.stringify({
  name: 'Cambia PIN, Suoni ed emozioni', short_name: 'PIN sito', display: 'standalone',
  background_color: '#EDEFEA', theme_color: '#22382D',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
});
function paginaAdmin() {
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex"><title>Cambia PIN | Suoni ed emozioni</title>
<link rel="manifest" href="/admin/manifest.webmanifest"><meta name="theme-color" content="#22382D">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,400&family=Hanken+Grotesk:wght@400;600&display=swap">
<style>
:root{--carta:#EDEFEA;--ink:#1D2420;--tenue:#56605A;--filo:#C6CEC4;--ok:#22603A;--err:#9B2C2C;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--carta:#141814;--ink:#E8ECE4;--tenue:#A3ACA4;--filo:#323A32;--ok:#8FD3A6;--err:#F0A3A3;color-scheme:dark}}
*{box-sizing:border-box}html,body{min-height:100%}
body{margin:0;display:grid;place-items:center;background:var(--carta);color:var(--ink);font:400 1.05rem/1.55 'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;padding:calc(env(safe-area-inset-top,0px) + 1.5rem) 1.2rem calc(env(safe-area-inset-bottom,0px) + 1.5rem)}
main{width:min(24rem,100%)}
h1{font:italic 400 clamp(2rem,8vw,2.6rem)/1.05 'Bodoni Moda','Bodoni 72',Didot,serif;margin:0 0 .5rem}
p{margin:0 0 1.2rem;color:var(--tenue)}
label{display:block;font-weight:600;margin:1rem 0 .4rem}
input{width:100%;height:3.4rem;padding:0 1rem;font-family:inherit;font-weight:600;font-size:1.5rem;letter-spacing:.25em;color:inherit;background:transparent;border:1px solid var(--ink);border-radius:2px}
#chiave{font-size:1rem;letter-spacing:0}
button{width:100%;height:3.4rem;margin-top:1rem;font-family:inherit;font-weight:600;font-size:1.05rem;border:0;border-radius:2px;background:var(--ink);color:var(--carta);cursor:pointer}
button[disabled]{opacity:.6}
.esito{margin-top:1rem;font-weight:600;min-height:1.6em}.ok{color:var(--ok)}.err{color:var(--err)}
.attuale{font-size:.95rem}.attuale strong{color:var(--ink);letter-spacing:.15em}
.secondario{background:transparent;color:var(--ink);border:1px solid var(--ink)}
.oppure{text-align:center;margin:1.4rem 0 .2rem;font-size:.9rem}
.condividi{margin-top:1.4rem;padding:1.1rem;border:1px solid var(--filo);border-radius:2px}
.condividi p{margin:0 0 .2rem;color:var(--ink)}.condividi .grande{font-family:inherit;font-weight:600;font-size:2rem;line-height:1.2;letter-spacing:.2em}
.azioni{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}.azioni button,.azioni a{margin-top:.8rem}
.azioni a{display:flex;align-items:center;justify-content:center;height:3.4rem;border:1px solid var(--ink);border-radius:2px;color:var(--ink);text-decoration:none;font-weight:600}
.piccolo{margin-top:2rem;font-size:.9rem}.piccolo a{color:var(--tenue)}
:focus-visible{outline:2px solid #2457C5;outline-offset:3px}
</style></head><body><main>
<h1>Cambia il PIN</h1>
<p class="attuale" id="attuale">Scrivi il nuovo PIN da 4 a 8 cifre.</p>
<form id="f" novalidate>
<div id="blocco-chiave" hidden><label for="chiave">Chiave di accesso</label><input id="chiave" autocomplete="current-password" type="password"></div>
<label for="pin">Nuovo PIN</label>
<input id="pin" name="pin" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" autocomplete="off" required>
<button type="submit" id="invia">Cambia PIN</button>
<p class="oppure">oppure</p>
<button type="button" class="secondario" id="genera">Genera un PIN casuale</button>
<p class="esito" id="esito" role="status" aria-live="polite"></p>
</form>
<section class="condividi" id="condividi" hidden aria-label="Condividi il PIN">
<p>Nuovo PIN da comunicare:</p>
<p class="grande" id="pin-nuovo"></p>
<div class="azioni">
<button type="button" id="share">Condividi</button>
<a id="whatsapp" href="#" target="_blank" rel="noopener">WhatsApp</a>
</div>
<button type="button" class="secondario" id="copia">Copia il messaggio</button>
</section>
<p class="piccolo"><a href="/admin" id="dimentica">Togli la chiave da questo dispositivo</a></p>
</main><script>
const K='vmg_admin_key';
const dalLink=new URLSearchParams(location.hash.slice(1)).get('k');
if(dalLink){try{localStorage.setItem(K,dalLink)}catch(e){}}
const chiave=()=>dalLink||(()=>{try{return localStorage.getItem(K)}catch(e){return null}})()||document.getElementById('chiave').value.trim();
if(!chiave()) document.getElementById('blocco-chiave').hidden=false;
const esito=document.getElementById('esito');
function mostra(t,ok){esito.textContent=t;esito.className='esito '+(ok?'ok':'err')}
async function leggi(){const k=chiave();if(!k)return;
  try{const r=await fetch('/api/pin',{headers:{Authorization:'Bearer '+k},cache:'no-store'});const d=await r.json();
    if(r.ok&&d.pin)document.getElementById('attuale').innerHTML='PIN attuale: <strong>'+d.pin+'</strong>';
    else if(r.status===401){document.getElementById('blocco-chiave').hidden=false;mostra((d.messaggio||'Chiave non valida.')+' Puoi anche inserirla qui sotto.',false)}
    else if(!r.ok)mostra(d.messaggio||'Errore '+r.status,false)}catch(e){}}
leggi();
function testo(pin){return 'Il PIN per visitare il sito Suoni ed emozioni di Villa Medici Giulini è '+pin+'. Apri www.suoniemozioni.it e inseriscilo quando richiesto.'}
function preparaCondivisione(pin){
  document.getElementById('pin-nuovo').textContent=pin;
  document.getElementById('whatsapp').href='https://wa.me/?text='+encodeURIComponent(testo(pin));
  document.getElementById('share').hidden=!navigator.share;
  document.querySelector('.azioni').style.gridTemplateColumns=navigator.share?'1fr 1fr':'1fr';
  document.getElementById('condividi').hidden=false;
}
document.getElementById('share').addEventListener('click',async()=>{const pin=document.getElementById('pin-nuovo').textContent;
  try{await navigator.share({title:'PIN Suoni ed emozioni',text:testo(pin)})}catch(e){}});
document.getElementById('copia').addEventListener('click',async()=>{const pin=document.getElementById('pin-nuovo').textContent;
  try{await navigator.clipboard.writeText(testo(pin));mostra('Messaggio copiato: incollalo dove vuoi.',true)}catch(e){mostra('Copia non riuscita: tieni premuto sul PIN per copiarlo.',false)}});
function casuale(){const a=new Uint32Array(1);let p;do{crypto.getRandomValues(a);p=String(a[0]%1000000).padStart(6,'0')}while(new Set(p).size===1||'0123456789'.includes(p)||'9876543210'.includes(p));return p}
document.getElementById('genera').addEventListener('click',()=>{document.getElementById('pin').value=casuale();document.getElementById('f').requestSubmit()});
document.getElementById('f').addEventListener('submit',async e=>{e.preventDefault();
  const pin=document.getElementById('pin').value.trim();const k=chiave();
  if(!k){document.getElementById('blocco-chiave').hidden=false;mostra('Inserisci la chiave di accesso.',false);return}
  if(!/^[0-9]{4,8}$/.test(pin)){mostra('Il PIN deve avere da 4 a 8 cifre.',false);return}
  const b=document.getElementById('invia');b.disabled=true;document.getElementById('condividi').hidden=true;mostra('Salvataggio…',true);
  try{const r=await fetch('/api/pin',{method:'POST',headers:{Authorization:'Bearer '+k,'Content-Type':'application/json'},body:JSON.stringify({pin})});
    const d=await r.json();mostra(d.messaggio||('Errore '+r.status),r.ok);
    if(r.ok){try{if(!dalLink)localStorage.setItem(K,k)}catch(e){}document.getElementById('pin').value='';document.getElementById('attuale').innerHTML='PIN attuale: <strong>'+d.pin+'</strong>';preparaCondivisione(d.pin)}
    else if(r.status===401)document.getElementById('blocco-chiave').hidden=false}
  catch(err){mostra('Connessione non riuscita. Riprova.',false)}finally{b.disabled=false}});
document.getElementById('dimentica').addEventListener('click',()=>{try{localStorage.removeItem(K)}catch(e){}});
</script></body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' } });
}

const COOKIE_LINGUA = 'vmg_lingua';
const leggiCookie = (req, nome) => (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + nome + '=([^;]+)'))?.[1];
function linguaBrowser(req) {
  const prima = (req.headers.get('accept-language') || '').split(',')[0].trim().toLowerCase();
  return !prima || prima.startsWith('it') ? 'it' : 'en';
}
const inInglese = (p) => p === '/en' || p.startsWith('/en/');
const versione = (p, l) => (l === 'en' ? (inInglese(p) ? p : p === '/' ? '/en/' : '/en' + p) : (inInglese(p) ? p.replace(/^\/en(?=\/|$)/, '') || '/' : p));
const ePagina = (p) => !/\.[a-z0-9]{2,5}$/i.test(p) || p.endsWith('.html');

export default async function middleware(req) {
  const url = new URL(req.url);
  if (url.pathname === '/api/pin' || url.pathname === '/api/pin/') return apiPin(req);
  if (url.pathname === '/admin' || url.pathname === '/admin/') return paginaAdmin();
  // Lingua: scelta esplicita (?lingua=it|en, dal selettore) oppure lingua del browser al primo accesso
  const sceltaLingua = url.searchParams.get('lingua');
  if (sceltaLingua === 'it' || sceltaLingua === 'en') {
    url.searchParams.delete('lingua');
    return new Response(null, { status: 302, headers: {
      Location: versione(url.pathname, sceltaLingua) + url.search,
      'Set-Cookie': `${COOKIE_LINGUA}=${sceltaLingua}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`,
      'Cache-Control': 'no-store',
    } });
  }
  if (req.method === 'GET' && ePagina(url.pathname) && url.pathname !== '/accesso') {
    const cookie = leggiCookie(req, COOKIE_LINGUA);
    const voluta = cookie === 'it' || cookie === 'en' ? cookie : (linguaBrowser(req) === 'en' ? 'en' : null);
    if (voluta && versione(url.pathname, voluta) !== url.pathname) {
      return new Response(null, { status: 302, headers: { Location: versione(url.pathname, voluta) + url.search, 'Cache-Control': 'no-store', Vary: 'Accept-Language, Cookie' } });
    }
  }
  if (url.pathname === '/admin/manifest.webmanifest') return new Response(MANIFEST_ADMIN, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-store' } });
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
    return pagina(dest, true, inInglese(dest) ? 'en' : 'it');
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
    return pagina(pulito, true, inInglese(url.pathname) ? 'en' : 'it');
  }
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)vmg_pin=(\d{4,8})/);
  if (m && (await pinValido(m[1]))) return next();
  return pagina(url.pathname + url.search, false, inInglese(url.pathname) ? 'en' : 'it');
}

function pagina(dest, errore, lang = 'it') {
  const EN = lang === 'en';
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const html = `<!doctype html><html lang="${EN ? 'en' : 'it'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex"><title>${EN ? 'Access' : 'Accesso'} | Suoni ed emozioni</title>
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
input{flex:1;min-width:0;height:3.2rem;padding:0 1rem;font-family:inherit;font-weight:600;font-size:1.4rem;letter-spacing:.3em;color:inherit;background:transparent;border:1px solid var(--ink);border-radius:2px}
button{height:3.2rem;padding:0 1.3rem;font-family:inherit;font-weight:600;font-size:1rem;border:0;border-radius:2px;background:var(--ink);color:var(--carta);cursor:pointer}
:focus-visible{outline:2px solid #2457C5;outline-offset:3px}
.err{color:var(--err);margin:.8rem 0 0}
.lingua{margin-top:2rem;font-size:.95rem}.lingua a{color:var(--tenue)}
</style></head><body><main>
<svg width="80" height="80" aria-hidden="true" style="display:block;margin-bottom:1.4rem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="30" fill="#22382D"/><g transform="translate(14 8) scale(.825)"><g fill="none" stroke="#F4EFE3" stroke-width="3.4" stroke-linejoin="miter"><path d="M30,150 V64 H130 V150"/><path d="M24,56 H136 M27,64 H133 M24,56 L27,64 M136,56 L133,64"/><rect x="45" y="78" width="18" height="26"/><rect x="97" y="78" width="18" height="26"/><path d="M41,73 H67 M93,73 H119"/><rect x="45" y="116" width="18" height="24"/><rect x="97" y="116" width="18" height="24"/><path d="M71,150 V114 H89 V150 M68,109 H92"/><path d="M16,150 H144"/></g><g fill="#F4EFE3" stroke="none"><rect x="25.5" y="53.5" width="9.0" height="2.5"/><rect x="28.5" y="51.5" width="3.0" height="2.25"/><ellipse cx="30" cy="47.75" rx="4.25" ry="4.0"/><rect x="28.12" y="42.75" width="3.75" height="2.0"/><rect x="26.75" y="41.5" width="6.5" height="1.5"/><circle cx="30" cy="39.879999999999995" r="1.38"/></g><g fill="#F4EFE3" stroke="none"><rect x="125.5" y="53.5" width="9.0" height="2.5"/><rect x="128.5" y="51.5" width="3.0" height="2.25"/><ellipse cx="130" cy="47.75" rx="4.25" ry="4.0"/><rect x="128.12" y="42.75" width="3.75" height="2.0"/><rect x="126.75" y="41.5" width="6.5" height="1.5"/><circle cx="130" cy="39.879999999999995" r="1.38"/></g></g></svg>
<h1>Suoni ed emozioni</h1>
<p>${EN ? 'An invitation to art and music at Villa Medici Giulini. The website is in preview. Enter the PIN you were given to come in.' : 'Invito all’arte e alla musica a Villa Medici Giulini. Il sito è in anteprima. Scrivi il PIN che ti è stato comunicato per entrare.'}</p>
<form method="post" action="/accesso">
<label for="pin">PIN</label>
<div class="riga"><input id="pin" name="pin" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{4,8}" required autofocus ${errore ? 'aria-describedby="err" aria-invalid="true"' : ''}>
<button type="submit">${EN ? 'Enter' : 'Entra'}</button></div>
<input type="hidden" name="dest" value="${esc(dest)}">
${errore ? `<p class="err" id="err" role="alert">${EN ? 'Incorrect PIN. Check the digits and try again.' : 'PIN non corretto. Controlla le cifre e riprova.'}</p>` : ''}
<p class="lingua"><a href="${esc(EN ? dest.replace(/^\/en(?=\/|$)/, '') || '/' : (dest === '/' ? '/en/' : '/en' + dest))}${(EN ? '?lingua=it' : '?lingua=en')}">${EN ? 'Italiano' : 'English'}</a></p>
</form></main></body></html>`;
  return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
