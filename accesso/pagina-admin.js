// Pagina di amministrazione, solo in italiano. La chiave arriva nel link dopo il # e resta sul dispositivo.
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
<style>
:root{--carta:#EDEFEA;--carta2:#E2E6DE;--ink:#1D2420;--tenue:#4C554F;--filo:#C6CEC4;--ok:#1F5C36;--okbg:#DCEBDF;--err:#9B2C2C;--errbg:#F3DEDC;--avv:#7A5300;--avvbg:#F3E7CC;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--carta:#141814;--carta2:#1D221D;--ink:#E8ECE4;--tenue:#B3BBB4;--filo:#323A32;--ok:#8FD3A6;--okbg:#1E3326;--err:#F0A3A3;--errbg:#3A2020;--avv:#E9C77B;--avvbg:#3A3020;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--carta);color:var(--ink);font:400 1rem/1.55 'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;padding:calc(env(safe-area-inset-top,0px) + 1.2rem) 1rem calc(env(safe-area-inset-bottom,0px) + 2rem)}
main{max-width:56rem;margin:0 auto}
h1{font:italic 400 clamp(2rem,7vw,2.6rem)/1.05 'Bodoni Moda','Bodoni 72',Didot,serif;margin:0 0 .3rem}
h2{font:italic 400 1.6rem/1.15 'Bodoni Moda','Bodoni 72',Didot,serif;margin:0 0 .8rem}
section{margin-top:1.4rem;padding:1.2rem;border:1px solid var(--filo);border-radius:4px;background:var(--carta)}
p{margin:0 0 .8rem;color:var(--tenue)}
label{display:block;font-weight:600;margin:.8rem 0 .35rem}
input{width:100%;height:3rem;padding:0 .9rem;font-family:inherit;font-size:1.05rem;color:inherit;background:transparent;border:1px solid var(--ink);border-radius:3px}
input.pin{font-size:1.4rem;font-weight:600;letter-spacing:.25em}
button,.btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;height:2.9rem;padding:0 1.1rem;margin-top:.8rem;font-family:inherit;font-weight:600;font-size:.98rem;border:1px solid var(--ink);border-radius:3px;background:var(--ink);color:var(--carta);cursor:pointer;text-decoration:none}
button.sec,.btn.sec{background:transparent;color:var(--ink)}
button.picc{height:2.2rem;padding:0 .75rem;margin:0;font-size:.85rem}
button[disabled]{opacity:.55}
.griglia{display:grid;gap:0 1rem;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))}
.interruttore{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.9rem 1rem;border-radius:4px;background:var(--carta2)}
.interruttore strong{font-size:1.05rem}
.interruttore input{width:3.4rem;height:2rem;accent-color:var(--ok);margin:0}
.stato{font-weight:600}
.esito{margin-top:.8rem;font-weight:600;min-height:1.4em}.ok{color:var(--ok)}.err{color:var(--err)}
.avviso{padding:.8rem 1rem;border-radius:4px;background:var(--avvbg);color:var(--avv);font-weight:600;margin-bottom:1rem}
.condividi{margin-top:1rem;padding:1rem;border:1px dashed var(--filo);border-radius:4px}
.grande{font-size:2rem;font-weight:600;letter-spacing:.2em;color:var(--ink);margin:.2rem 0}
.azioni{display:flex;flex-wrap:wrap;gap:.5rem}
.filtri{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 1rem}
.filtri button{margin:0;height:2.2rem;font-size:.85rem}
.filtri button[aria-pressed=false]{background:transparent;color:var(--ink)}
.voce{display:grid;grid-template-columns:1fr auto;gap:.2rem 1rem;padding:.85rem 0;border-top:1px solid var(--filo)}
.voce .riga1{display:flex;flex-wrap:wrap;gap:.3rem .7rem;align-items:baseline}
.badge{display:inline-block;padding:.08rem .55rem;border-radius:999px;font-size:.8rem;font-weight:600}
.b-ok{background:var(--okbg);color:var(--ok)}.b-err{background:var(--errbg);color:var(--err)}.b-avv{background:var(--avvbg);color:var(--avv)}
.det{font-size:.9rem;color:var(--tenue)}
.det a{color:inherit}
.dx{display:flex;flex-direction:column;align-items:flex-end;gap:.35rem}
.vuoto{color:var(--tenue);padding:1rem 0}
.piccolo{font-size:.88rem}
a{color:inherit}
:focus-visible{outline:2px solid #2457C5;outline-offset:3px}
</style></head><body><main>
<h1>Amministrazione</h1>
<p>Suoni ed emozioni, Villa Medici Giulini</p>

<section id="s-chiave" hidden><h2>Chiave di accesso</h2><p>Inserisci la chiave per gestire il sito.</p><label for="chiave">Chiave</label><input id="chiave" type="password" autocomplete="current-password"><button id="salva-chiave">Continua</button><p class="esito err" id="e-chiave"></p></section>

<div id="contenuto" hidden>
<div class="avviso" id="avviso-archivio" hidden>L’archivio non è ancora collegato: il controllo della posizione e il registro degli accessi si attivano dopo aver collegato Upstash Redis al progetto su Vercel.</div>

<section aria-labelledby="t-pos">
<h2 id="t-pos">Controllo della posizione</h2>
<div class="interruttore"><div><strong>Accesso solo dalla villa</strong><br><span class="stato" id="stato-gps">…</span></div><input type="checkbox" id="gps" aria-label="Accesso solo dalla villa"></div>
<p class="piccolo" style="margin-top:.8rem">Quando è attivo, si entra solo con il PIN e con il telefono entro il raggio indicato. I dispositivi autorizzati qui sotto entrano anche da fuori.</p>
<div class="griglia">
<div><label for="raggio">Raggio (metri)</label><input id="raggio" type="number" min="50" max="5000" step="10"></div>
<div><label for="durata">Durata dell’accesso (ore)</label><input id="durata" type="number" min="1" max="72" step="1"></div>
<div><label for="lat">Latitudine del centro</label><input id="lat" type="number" step="0.000001"></div>
<div><label for="lon">Longitudine del centro</label><input id="lon" type="number" step="0.000001"></div>
</div>
<div class="azioni"><button id="salva-imp">Salva</button><button class="sec" id="qui">Usa la mia posizione come centro</button><a class="btn sec" id="mappa-centro" target="_blank" rel="noopener">Vedi il centro sulla mappa</a></div>
<p class="esito" id="e-imp" role="status"></p>
</section>

<section aria-labelledby="t-acc">
<h2 id="t-acc">Accessi</h2>
<p class="piccolo">Ultimi accessi degli ultimi 30 giorni, i più recenti in alto. La posizione si apre su OpenStreetMap.</p>
<div class="filtri" id="filtri">
<button aria-pressed="true" data-f="tutti">Tutti</button><button aria-pressed="false" data-f="ok">Entrati</button><button aria-pressed="false" data-f="no">Respinti</button><button aria-pressed="false" data-f="bypass">Senza GPS</button>
</div>
<div id="accessi"><p class="vuoto">Caricamento…</p></div>
<div class="azioni"><button class="sec" id="aggiorna">Aggiorna</button></div>
</section>

<section aria-labelledby="t-byp">
<h2 id="t-byp">Dispositivi autorizzati senza GPS</h2>
<p class="piccolo">Questi dispositivi entrano con il PIN anche da fuori dalla villa. Per aggiungerne uno, tocca «Consenti senza GPS» accanto a un suo accesso.</p>
<div id="bypass"><p class="vuoto">Nessuno.</p></div>
</section>

<section aria-labelledby="t-pin">
<h2 id="t-pin">PIN</h2>
<p id="attuale">…</p>
<label for="pin">Nuovo PIN</label><input id="pin" class="pin" inputmode="numeric" maxlength="8" autocomplete="off">
<div class="azioni"><button id="cambia">Cambia PIN</button><button class="sec" id="genera">Genera un PIN casuale</button></div>
<p class="esito" id="e-pin" role="status"></p>
<div class="condividi" id="condividi" hidden><p>Nuovo PIN da comunicare:</p><p class="grande" id="pin-nuovo"></p>
<div class="azioni"><button id="share">Condividi</button><a class="btn sec" id="whatsapp" target="_blank" rel="noopener">WhatsApp</a><button class="sec" id="copia">Copia il messaggio</button></div></div>
</section>

<p class="piccolo" style="margin-top:2rem"><a href="/admin" id="dimentica">Togli la chiave da questo dispositivo</a></p>
</div>
</main>
<script>
(function(){
var K='vmg_admin_key', link=new URLSearchParams(location.hash.slice(1)).get('k');
if(link){try{localStorage.setItem(K,link)}catch(e){}}
function chiave(){return link||(function(){try{return localStorage.getItem(K)}catch(e){return null}})()}
var $=function(id){return document.getElementById(id)};
var S=null, filtro='tutti';
function api(p,metodo,dati){return fetch(p,{method:metodo||'GET',headers:{'Authorization':'Bearer '+chiave(),'Content-Type':'application/json'},body:dati?JSON.stringify(dati):undefined,cache:'no-store'}).then(function(r){return r.json().then(function(j){j._s=r.status;return j})})}
function esito(id,t,ok){var e=$(id);e.textContent=t;e.className='esito '+(ok?'ok':'err')}
function fmtDist(m){if(m==null)return '';return m>=1000?(m/1000).toFixed(m>=10000?0:1).replace('.',',')+' km':m+' m'}
function fmtData(t){var d=new Date(t);return d.toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}
function el(tag,cls,txt){var x=document.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=txt;return x}
var ESITI={ok:['Entrato','b-ok'],bypass:['Entrato senza GPS','b-avv'],libero:['Entrato (controllo spento)','b-ok'],pin:['PIN errato','b-err'],fuori:['Fuori dalla villa','b-err'],nogps:['Senza posizione','b-err']};
function nomeDisp(d){return (S.nomi&&S.nomi[d])||('Dispositivo '+d.slice(0,6))}
function carica(){
  api('/api/admin/stato').then(function(r){
    if(r._s===401||r._s===503&&!r.archivio&&r.messaggio&&r.messaggio.indexOf('PIN_ADMIN_KEY')>=0){$('s-chiave').hidden=false;$('contenuto').hidden=true;esito('e-chiave',r.messaggio||'Chiave non valida.',false);return}
    $('s-chiave').hidden=true;$('contenuto').hidden=false;S=r;
    $('avviso-archivio').hidden=!!r.archivio;
    var i=r.impostazioni;$('gps').checked=!!i.gps;$('gps').disabled=!r.archivio;$('raggio').value=i.raggio;$('durata').value=i.durata;$('lat').value=i.lat;$('lon').value=i.lon;
    $('stato-gps').textContent=i.gps?'Attivo: si entra solo dalla villa':'Spento: si entra da ovunque con il PIN';
    $('mappa-centro').href='https://www.openstreetmap.org/?mlat='+i.lat+'&mlon='+i.lon+'#map=18/'+i.lat+'/'+i.lon;
    $('attuale').innerHTML=r.pin?'PIN attuale: <strong style="letter-spacing:.15em;color:var(--ink)">'+r.pin+'</strong>':'Il PIN attuale non è salvato nell’archivio: generane uno.';
    disegnaAccessi();disegnaBypass();
  }).catch(function(){esito('e-imp','Connessione non riuscita.',false)});
}
function disegnaAccessi(){
  var box=$('accessi');box.innerHTML='';
  var lista=(S.accessi||[]).filter(function(a){return filtro==='tutti'||(filtro==='ok'&&(a.e==='ok'||a.e==='libero'||a.e==='bypass'))||(filtro==='no'&&(a.e==='pin'||a.e==='fuori'||a.e==='nogps'))||(filtro==='bypass'&&a.e==='bypass')});
  if(!lista.length){box.appendChild(el('p','vuoto',S.archivio?'Nessun accesso registrato.':'Il registro si attiva dopo aver collegato l’archivio.'));return}
  lista.forEach(function(a){
    var v=el('div','voce'),sx=el('div'),r1=el('div','riga1'),es=ESITI[a.e]||[a.e,'b-avv'];
    r1.appendChild(el('strong',null,fmtData(a.t)));r1.appendChild(el('span','badge '+es[1],es[0]));
    if(a.dist!=null)r1.appendChild(el('span',null,'a '+fmtDist(a.dist)+(a.acc?' (±'+Math.round(a.acc)+' m)':'')));
    sx.appendChild(r1);
    var det=el('div','det');det.appendChild(document.createTextNode(nomeDisp(a.d)+(a.ua?' · '+a.ua:'')+(a.citta?' · rete: '+a.citta:'')+(a.lang==='en'?' · EN':'')));
    if(a.lat!=null){det.appendChild(document.createTextNode(' · '));var m=el('a',null,'mappa');m.href='https://www.openstreetmap.org/?mlat='+a.lat+'&mlon='+a.lon+'#map=17/'+a.lat+'/'+a.lon;m.target='_blank';m.rel='noopener';det.appendChild(m)}
    sx.appendChild(det);v.appendChild(sx);
    var dx=el('div','dx');
    if(a.d){var inB=S.bypass.indexOf(a.d)>=0,b=el('button','picc'+(inB?' sec':''),inB?'Revoca permesso':'Consenti senza GPS');b.onclick=function(){bypass(a.d,!inB)};dx.appendChild(b)}
    v.appendChild(dx);box.appendChild(v);
  });
}
function disegnaBypass(){
  var box=$('bypass');box.innerHTML='';
  if(!S.bypass.length){box.appendChild(el('p','vuoto','Nessuno.'));return}
  S.bypass.forEach(function(d){
    var v=el('div','voce'),sx=el('div');sx.appendChild(el('strong',null,nomeDisp(d)));
    var ult=(S.accessi||[]).filter(function(a){return a.d===d})[0];
    sx.appendChild(el('div','det',ult?('Ultimo accesso '+fmtData(ult.t)+(ult.ua?' · '+ult.ua:'')):'Nessun accesso recente'));
    var dx=el('div','dx'),n=el('button','picc sec','Rinomina'),r=el('button','picc','Revoca');
    n.onclick=function(){var x=prompt('Nome del dispositivo (per esempio «Telefono di Maria»)',(S.nomi&&S.nomi[d])||'');if(x!==null)bypass(d,true,x)};
    r.onclick=function(){bypass(d,false)};dx.appendChild(n);dx.appendChild(r);v.appendChild(sx);v.appendChild(dx);box.appendChild(v);
  });
}
function bypass(d,consenti,nome){
  if(consenti&&nome===undefined){var x=prompt('Vuoi dare un nome a questo dispositivo? (facoltativo, per esempio «Telefono di Maria»)','');if(x===null)return;nome=x}
  api('/api/admin/bypass','POST',{dispositivo:d,consenti:consenti,nome:nome}).then(function(r){if(!r.ok)alert(r.messaggio||'Errore');carica()});
}
$('gps').onchange=function(){salva({gps:$('gps').checked})};
$('salva-imp').onclick=function(){salva({raggio:+$('raggio').value,durata:+$('durata').value,lat:+$('lat').value,lon:+$('lon').value})};
function salva(d){esito('e-imp','Salvataggio…',true);api('/api/admin/impostazioni','POST',d).then(function(r){esito('e-imp',r.messaggio||(r.ok?'Salvato.':'Errore'),r.ok);if(r.ok)carica();else $('gps').checked=!$('gps').checked})}
$('qui').onclick=function(){if(!navigator.geolocation){esito('e-imp','Posizione non disponibile su questo dispositivo.',false);return}
  esito('e-imp','Lettura della posizione…',true);
  navigator.geolocation.getCurrentPosition(function(p){$('lat').value=p.coords.latitude.toFixed(6);$('lon').value=p.coords.longitude.toFixed(6);esito('e-imp','Posizione letta (±'+Math.round(p.coords.accuracy)+' m). Tocca «Salva» per usarla come centro.',true)},function(){esito('e-imp','Non è stato possibile leggere la posizione.',false)},{enableHighAccuracy:true,timeout:20000,maximumAge:0})};
$('filtri').onclick=function(e){var b=e.target.closest('button');if(!b)return;filtro=b.dataset.f;[].forEach.call(this.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b)});disegnaAccessi()};
$('aggiorna').onclick=carica;
// PIN
function testo(p){return 'Il PIN per visitare il sito Suoni ed emozioni di Villa Medici Giulini è '+p+'. Apri www.suoniemozioni.it e inseriscilo quando richiesto.'}
function casuale(){var a=new Uint32Array(1),p;do{crypto.getRandomValues(a);p=String(a[0]%1000000).padStart(6,'0')}while(new Set(p).size===1||'0123456789'.indexOf(p)>=0||'9876543210'.indexOf(p)>=0);return p}
function cambia(p){if(!/^[0-9]{4,8}$/.test(p)){esito('e-pin','Il PIN deve avere da 4 a 8 cifre.',false);return}
  $('condividi').hidden=true;esito('e-pin','Salvataggio…',true);
  api('/api/pin','POST',{pin:p}).then(function(r){esito('e-pin',r.messaggio||('Errore '+r._s),r.ok);if(r.ok){$('pin').value='';$('pin-nuovo').textContent=r.pin;$('whatsapp').href='https://wa.me/?text='+encodeURIComponent(testo(r.pin));$('share').hidden=!navigator.share;$('condividi').hidden=false;carica()}})}
$('cambia').onclick=function(){cambia($('pin').value.trim())};
$('genera').onclick=function(){cambia(casuale())};
$('share').onclick=function(){navigator.share({title:'PIN Suoni ed emozioni',text:testo($('pin-nuovo').textContent)}).catch(function(){})};
$('copia').onclick=function(){navigator.clipboard.writeText(testo($('pin-nuovo').textContent)).then(function(){esito('e-pin','Messaggio copiato.',true)},function(){esito('e-pin','Copia non riuscita.',false)})};
$('salva-chiave').onclick=function(){var k=$('chiave').value.trim();if(!k)return;try{localStorage.setItem(K,k)}catch(e){}link=k;carica()};
$('dimentica').onclick=function(){try{localStorage.removeItem(K)}catch(e){}};
if(!chiave()){$('s-chiave').hidden=false}else carica();
})();
</script></body></html>`;

export function paginaAdmin() {
  return new Response(HTML, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' } });
}
