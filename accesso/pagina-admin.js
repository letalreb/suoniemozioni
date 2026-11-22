// Pagina di amministrazione, solo in italiano, con accesso tramite account Google autorizzati.
export const MANIFEST_ADMIN = JSON.stringify({
  name: 'Amministrazione, Suoni ed emozioni', short_name: 'Admin sito', display: 'standalone', start_url: '/admin',
  background_color: '#EDEFEA', theme_color: '#22382D',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
});

const HTML = String.raw`<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex"><title>Amministrazione | Suoni ed emozioni</title>
<link rel="manifest" href="/admin/manifest.webmanifest"><meta name="theme-color" content="#22382D">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,400&family=Hanken+Grotesk:wght@400;600&display=swap">
<script src="https://accounts.google.com/gsi/client" async></script>
<style>
:root{--carta:#EDEFEA;--carta2:#E2E6DE;--ink:#1D2420;--tenue:#4C554F;--filo:#C6CEC4;--ok:#1F5C36;--okbg:#DCEBDF;--err:#9B2C2C;--errbg:#F3DEDC;--avv:#7A5300;--avvbg:#F3E7CC;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--carta:#141814;--carta2:#1D221D;--ink:#E8ECE4;--tenue:#B3BBB4;--filo:#323A32;--ok:#8FD3A6;--okbg:#1E3326;--err:#F0A3A3;--errbg:#3A2020;--avv:#E9C77B;--avvbg:#3A3020;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--carta);color:var(--ink);font:400 1rem/1.55 'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;padding:calc(env(safe-area-inset-top,0px) + 1.2rem) 1rem calc(env(safe-area-inset-bottom,0px) + 2rem)}
main{max-width:46rem;margin:0 auto}
h1{font:italic 400 clamp(2rem,7vw,2.6rem)/1.05 'Bodoni Moda','Bodoni 72',Didot,serif;margin:0 0 .3rem}
h2{font:italic 400 1.6rem/1.15 'Bodoni Moda','Bodoni 72',Didot,serif;margin:0 0 .8rem}
section{margin-top:1.4rem;padding:1.2rem;border:1px solid var(--filo);border-radius:4px}
p{margin:0 0 .8rem;color:var(--tenue)}
label{display:block;font-weight:600;margin:.8rem 0 .35rem}
input{width:100%;height:3rem;padding:0 .9rem;font-family:inherit;font-size:1.4rem;font-weight:600;letter-spacing:.25em;color:inherit;background:transparent;border:1px solid var(--ink);border-radius:3px}
button,.btn{display:inline-flex;align-items:center;justify-content:center;height:2.9rem;padding:0 1.1rem;margin-top:.8rem;font-family:inherit;font-weight:600;font-size:.98rem;border:1px solid var(--ink);border-radius:3px;background:var(--ink);color:var(--carta);cursor:pointer;text-decoration:none}
button.sec,.btn.sec{background:transparent;color:var(--ink)}
.azioni{display:flex;flex-wrap:wrap;gap:.5rem}
.esito{margin-top:.8rem;font-weight:600;min-height:1.4em}.ok{color:var(--ok)}.err{color:var(--err)}
.avviso{padding:.8rem 1rem;border-radius:4px;background:var(--avvbg);color:var(--avv);font-weight:600;margin:1rem 0}
.utente{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.5rem;margin-top:.6rem}
.utente button{margin:0;height:2.3rem;font-size:.88rem}
.condividi{margin-top:1rem;padding:1rem;border:1px dashed var(--filo);border-radius:4px}
.grande{font-size:2rem;font-weight:600;letter-spacing:.2em;color:var(--ink);margin:.2rem 0}
.filtri{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 1rem}
.filtri button{margin:0;height:2.2rem;font-size:.85rem}
.filtri button[aria-pressed=false]{background:transparent;color:var(--ink)}
.voce{padding:.75rem 0;border-top:1px solid var(--filo)}
.voce .riga1{display:flex;flex-wrap:wrap;gap:.3rem .7rem;align-items:baseline}
.badge{display:inline-block;padding:.08rem .55rem;border-radius:999px;font-size:.8rem;font-weight:600}
.b-ok{background:var(--okbg);color:var(--ok)}.b-err{background:var(--errbg);color:var(--err)}
.det{font-size:.9rem;color:var(--tenue)}
.vuoto{color:var(--tenue);padding:1rem 0}
.piccolo{font-size:.88rem}
#bottone-google{margin-top:1rem;min-height:44px}
:focus-visible{outline:2px solid #2457C5;outline-offset:3px}
</style></head><body><main>
<h1>Amministrazione</h1>
<p>Suoni ed emozioni, Villa Medici Giulini</p>

<section id="s-login" hidden>
<h2>Accedi</h2>
<p>Entra con il tuo account Google. Possono accedere solo gli indirizzi autorizzati.</p>
<div id="bottone-google"></div>
<div class="avviso" id="no-google" hidden>L’accesso con Google non è ancora configurato su Vercel: mancano le variabili <code>GOOGLE_CLIENT_ID</code> e <code>ADMIN_EMAILS</code>.</div>
<p class="esito err" id="e-login" role="alert"></p>
</section>

<div id="contenuto" hidden>
<div class="utente"><span class="piccolo" id="utente"></span><button class="sec" id="esci">Esci</button></div>
<div class="avviso" id="avviso-archivio" hidden>L’archivio non è collegato: il PIN si salva comunque, ma il registro degli accessi si attiva solo dopo aver collegato Upstash Redis al progetto su Vercel.</div>

<section aria-labelledby="t-pin">
<h2 id="t-pin">PIN di accesso al sito</h2>
<p id="attuale">…</p>
<label for="pin">Nuovo PIN</label><input id="pin" inputmode="numeric" maxlength="8" autocomplete="off">
<div class="azioni"><button id="cambia">Cambia PIN</button><button class="sec" id="genera">Genera un PIN casuale</button></div>
<p class="esito" id="e-pin" role="status"></p>
<div class="condividi" id="condividi" hidden><p>Nuovo PIN da comunicare:</p><p class="grande" id="pin-nuovo"></p>
<div class="azioni"><button id="share">Condividi</button><a class="btn sec" id="whatsapp" target="_blank" rel="noopener">WhatsApp</a><button class="sec" id="copia">Copia il messaggio</button></div></div>
</section>

<section aria-labelledby="t-acc">
<h2 id="t-acc">Accessi al sito</h2>
<p class="piccolo">Tentativi di accesso degli ultimi 30 giorni, i più recenti in alto.</p>
<div class="filtri" id="filtri"><button aria-pressed="true" data-f="tutti">Tutti</button><button aria-pressed="false" data-f="ok">Entrati</button><button aria-pressed="false" data-f="no">PIN errato</button></div>
<div id="accessi"><p class="vuoto">Caricamento…</p></div>
<div class="azioni"><button class="sec" id="aggiorna">Aggiorna</button></div>
</section>
</div>
</main>
<script>var CLIENT_ID=__CLIENT_ID__;</script>
<script>
(function(){
var $=function(id){return document.getElementById(id)}, S=null, filtro='tutti';
function api(p,metodo,dati){return fetch(p,{method:metodo||'GET',headers:{'Content-Type':'application/json'},body:dati?JSON.stringify(dati):undefined,credentials:'same-origin',cache:'no-store'}).then(function(r){return r.json().then(function(j){j._s=r.status;return j})})}
function esito(id,t,ok){var e=$(id);e.textContent=t;e.className='esito '+(ok?'ok':'err')}
function fmtData(t){var d=new Date(t);return d.toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'2-digit'})+' '+d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}
function el(tag,cls,txt){var x=document.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=txt;return x}
function mostraLogin(msg){
  $('contenuto').hidden=true;$('s-login').hidden=false;
  if(msg)esito('e-login',msg,false);
  if(!CLIENT_ID){$('no-google').hidden=false;return}
  (function prova(){
    if(!window.google||!google.accounts||!google.accounts.id){setTimeout(prova,150);return}
    google.accounts.id.initialize({client_id:CLIENT_ID,callback:function(r){
      api('/api/admin/login','POST',{credential:r.credential}).then(function(x){if(x.ok)carica();else esito('e-login',x.messaggio||'Accesso non consentito.',false)})
    },auto_select:true,ux_mode:'popup'});
    google.accounts.id.renderButton($('bottone-google'),{theme:'outline',size:'large',text:'signin_with',locale:'it',shape:'rectangular'});
    google.accounts.id.prompt();
  })();
}
var ESITI={libero:['Entrato','b-ok'],ok:['Entrato','b-ok'],bypass:['Entrato','b-ok'],pin:['PIN errato','b-err']};
function carica(){
  api('/api/admin/stato').then(function(r){
    if(r._s===401||r._s===403){mostraLogin(r._s===403?r.messaggio:'');return}
    if(!r.ok){mostraLogin(r.messaggio||'Errore');return}
    S=r;$('s-login').hidden=true;$('contenuto').hidden=false;
    $('utente').textContent='Accesso come '+r.utente;
    $('avviso-archivio').hidden=!!r.archivio;
    $('attuale').innerHTML=r.pin?'PIN attuale: <strong style="letter-spacing:.15em;color:var(--ink)">'+r.pin+'</strong>':'Il PIN attuale non è salvato: generane uno.';
    disegna();
  }).catch(function(){mostraLogin('Connessione non riuscita.')});
}
function disegna(){
  var box=$('accessi');box.innerHTML='';
  var l=(S.accessi||[]).filter(function(a){var ok=a.e!=='pin';return filtro==='tutti'||(filtro==='ok'&&ok)||(filtro==='no'&&!ok)});
  if(!l.length){box.appendChild(el('p','vuoto',S.archivio?'Nessun accesso registrato.':'Il registro si attiva dopo aver collegato l’archivio.'));return}
  l.forEach(function(a){var v=el('div','voce'),r1=el('div','riga1'),es=ESITI[a.e]||[a.e,'b-ok'];
    r1.appendChild(el('strong',null,fmtData(a.t)));r1.appendChild(el('span','badge '+es[1],es[0]));v.appendChild(r1);
    v.appendChild(el('div','det',[a.ua,a.citta?'rete: '+a.citta:'',a.lang==='en'?'sito in inglese':'',a.d?'dispositivo '+a.d.slice(0,6):''].filter(Boolean).join(' · ')));box.appendChild(v)});
}
$('filtri').onclick=function(e){var b=e.target.closest('button');if(!b)return;filtro=b.dataset.f;[].forEach.call(this.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b)});disegna()};
$('aggiorna').onclick=carica;
$('esci').onclick=function(){api('/api/admin/logout','POST').then(function(){if(window.google&&google.accounts&&google.accounts.id)google.accounts.id.disableAutoSelect();mostraLogin('')})};
function testo(p){return 'Il PIN per visitare il sito Suoni ed emozioni di Villa Medici Giulini è '+p+'. Apri www.suoniemozioni.it e inseriscilo quando richiesto.'}
function casuale(){var a=new Uint32Array(1),p;do{crypto.getRandomValues(a);p=String(a[0]%1000000).padStart(6,'0')}while(new Set(p).size===1||'0123456789'.indexOf(p)>=0||'9876543210'.indexOf(p)>=0);return p}
function cambia(p){if(!/^[0-9]{4,8}$/.test(p)){esito('e-pin','Il PIN deve avere da 4 a 8 cifre.',false);return}
  $('condividi').hidden=true;esito('e-pin','Salvataggio…',true);
  api('/api/pin','POST',{pin:p}).then(function(r){esito('e-pin',r.messaggio||('Errore '+r._s),r.ok);if(r.ok){$('pin').value='';$('pin-nuovo').textContent=r.pin;$('whatsapp').href='https://wa.me/?text='+encodeURIComponent(testo(r.pin));$('share').hidden=!navigator.share;$('condividi').hidden=false;$('attuale').innerHTML='PIN attuale: <strong style="letter-spacing:.15em;color:var(--ink)">'+r.pin+'</strong>'}})}
$('cambia').onclick=function(){cambia($('pin').value.trim())};
$('genera').onclick=function(){cambia(casuale())};
$('share').onclick=function(){navigator.share({title:'PIN Suoni ed emozioni',text:testo($('pin-nuovo').textContent)}).catch(function(){})};
$('copia').onclick=function(){navigator.clipboard.writeText(testo($('pin-nuovo').textContent)).then(function(){esito('e-pin','Messaggio copiato.',true)},function(){esito('e-pin','Copia non riuscita.',false)})};
carica();
})();
</script></body></html>`;

export function paginaAdmin(clientId) {
  return new Response(HTML.replace('__CLIENT_ID__', JSON.stringify(clientId || '')), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer-when-downgrade', 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' },
  });
}
