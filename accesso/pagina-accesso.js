// Schermata di accesso, in italiano o inglese: solo PIN.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const TESTI = {
  it: {
    titolo: 'Accesso', intro: 'Invito all’arte e alla musica a Villa Medici Giulini. Il sito è in anteprima: scrivi il PIN che ti è stato comunicato.',
    entra: 'Entra', pin: 'PIN', altra: 'English',
    err: { pin: 'PIN non corretto. Controlla le cifre e riprova.', rete: 'Connessione non riuscita. Riprova.' },
  },
  en: {
    titolo: 'Access', intro: 'An invitation to art and music at Villa Medici Giulini. The website is in preview: enter the PIN you were given.',
    entra: 'Enter', pin: 'PIN', altra: 'Italiano',
    err: { pin: 'Incorrect PIN. Check the digits and try again.', rete: 'Connection failed. Please try again.' },
  },
};
const LOGO = '<svg width="80" height="80" viewBox="0 0 160 160" aria-hidden="true" style="display:block;margin-bottom:1.4rem"><rect width="160" height="160" rx="30" fill="#22382D"/><g transform="translate(14 8) scale(.825)" fill="none" stroke="#F4EFE3" stroke-width="3.4"><path d="M30,150 V64 H130 V150"/><path d="M24,56 H136 M27,64 H133 M24,56 L27,64 M136,56 L133,64"/><rect x="45" y="78" width="18" height="26"/><rect x="97" y="78" width="18" height="26"/><path d="M41,73 H67 M93,73 H119"/><rect x="45" y="116" width="18" height="24"/><rect x="97" y="116" width="18" height="24"/><path d="M71,150 V114 H89 V150 M68,109 H92"/><path d="M16,150 H144"/></g></svg>';

export function paginaAccesso({ dest = '/', lang = 'it', errore = '', pin = '' }) {
  const T = TESTI[lang] || TESTI.it;
  const EN = lang === 'en';
  const altroDest = EN ? dest.replace(/^\/en(?=\/|$)/, '') || '/' : dest === '/' ? '/en/' : '/en' + dest;
  const msgErrore = errore ? T.err[errore] || T.err.pin : '';
  const cfg = { err: T.err };
  const html = `<!doctype html><html lang="${EN ? 'en' : 'it'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex"><title>${T.titolo} | Suoni ed emozioni</title>
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,400&family=Hanken+Grotesk:wght@400;600&display=swap">
<style>
:root{--carta:#EDEFEA;--ink:#1D2420;--tenue:#4C554F;--filo:#C6CEC4;--err:#9B2C2C;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--carta:#141814;--ink:#E8ECE4;--tenue:#B3BBB4;--filo:#323A32;--err:#F0A3A3;color-scheme:dark}}
*{box-sizing:border-box}html,body{min-height:100%}
body{margin:0;display:grid;grid-template-columns:minmax(0,1fr);place-items:center;background:var(--carta);color:var(--ink);font:400 1.05rem/1.55 'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;padding:calc(env(safe-area-inset-top,0px) + 1.5rem) 1.2rem calc(env(safe-area-inset-bottom,0px) + 1.5rem)}
main{width:min(26rem,100%)}
h1{font:italic 400 clamp(2.4rem,9vw,3.4rem)/1 'Bodoni Moda','Bodoni 72',Didot,serif;margin:0 0 .8rem}
p{color:var(--tenue);margin:0 0 1.6rem}
label{display:block;font-weight:600;margin-bottom:.4rem}
.riga{display:flex;gap:.5rem}
input{flex:1;min-width:0;height:3.2rem;padding:0 1rem;font-family:inherit;font-weight:600;font-size:1.4rem;letter-spacing:.3em;color:inherit;background:transparent;border:1px solid var(--ink);border-radius:2px}
button{height:3.2rem;padding:0 1.3rem;font-family:inherit;font-weight:600;font-size:1rem;border:0;border-radius:2px;background:var(--ink);color:var(--carta);cursor:pointer}
button[disabled]{opacity:.6}
:focus-visible{outline:2px solid #2457C5;outline-offset:3px}
.err{color:var(--err);margin:.9rem 0 0;font-weight:600}
.lingua{margin-top:1.4rem;font-size:.95rem}.lingua a{color:var(--tenue)}
</style></head><body><main>
${LOGO}
<h1>Suoni ed emozioni</h1>
<p>${T.intro}</p>
<form method="post" action="/accesso" id="f">
<label for="pin">${T.pin}</label>
<div class="riga"><input id="pin" name="pin" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{4,8}" maxlength="8" required autofocus value="${esc(pin)}"${errore ? ' aria-describedby="err" aria-invalid="true"' : ''}>
<button type="submit" id="entra">${T.entra}</button></div>
<input type="hidden" name="dest" value="${esc(dest)}"><input type="hidden" name="lang" value="${EN ? 'en' : 'it'}">
<p class="err" id="err" role="alert"${msgErrore ? '' : ' hidden'}>${esc(msgErrore)}</p>
</form>
<p class="lingua"><a href="${esc(altroDest)}?lingua=${EN ? 'it' : 'en'}">${T.altra}</a></p>
</main>
<script>var CFG=${JSON.stringify(cfg)};</script>
<script>${CLIENT}</script>
</body></html>`;
  return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

// Script del browser: identificativo anonimo del dispositivo (per il registro) e invio del PIN.
const CLIENT = String.raw`
(function(){
  var K='vmg_dev', dev;
  try{dev=localStorage.getItem(K)}catch(e){}
  if(!dev){dev=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)).toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,36);try{localStorage.setItem(K,dev)}catch(e){}}
  var f=document.getElementById('f'), err=document.getElementById('err'), b=document.getElementById('entra');
  function errore(t){err.textContent=t;err.hidden=false;b.disabled=false}
  f.addEventListener('submit',function(e){
    e.preventDefault(); err.hidden=true; b.disabled=true;
    if(!/^[0-9]{4,8}$/.test(f.pin.value.trim())){errore(CFG.err.pin);return}
    fetch('/accesso',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({pin:f.pin.value.trim(),dest:f.dest.value,lang:f.lang.value,dev:dev}),credentials:'same-origin'})
      .then(function(r){return r.json()}).then(function(r){ if(r.ok){location.replace(r.dest||'/');return} errore(CFG.err[r.errore]||CFG.err.pin); })
      .catch(function(){errore(CFG.err.rete)});
  });
})();`;
