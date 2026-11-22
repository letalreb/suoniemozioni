# Suoni ed emozioni

Sito di Villa Medici Giulini (Briosco) costruito sul volume *Suoni ed emozioni*: le 50 sale del percorso, il Teatrino e il giardino. Pubblicato su Vercel all’indirizzo https://www.suoniemozioni.it.

## Pagine

| Indirizzo | Contenuto |
|---|---|
| `/` | Copertina, striscia delle 50 sale, i cinque luoghi della dimora, Teatrino e giardino |
| `/sale/` | Tutte le sale per edificio, con ricerca |
| `/sale/12/` | Foto d’apertura, strumenti e arredi, schede delle opere dal volume, sala precedente e successiva |
| `/teatrino/`, `/giardino/` | Testi e fotografie dal volume |

Il menu «Ascolta gli strumenti» porta a https://www.allaricercadeisuoniperduti.com.

## Lingue

Il sito è in italiano (alla radice) e in inglese (sotto `/en/`), generati dalle stesse viste in `src/views/` con i testi di `src/lib/i18n.ts`. Al primo accesso, per esempio dal QR code, `middleware.js` legge la lingua del browser: se non è l’italiano porta alla versione inglese. Il pulsante English/Italiano nella testata salva la scelta per un anno (cookie `vmg_lingua`). La pagina `/admin` resta solo in italiano.

## Contenuti

In `src/data/`: `sale.json` (sale, foto, strumenti e arredi, schede), `sezioni.json` (i cinque edifici), `strumenti.json`, `speciali.json` (Teatrino e giardino). Le immagini sono in `public/img/<numero sala>/`.

## Accesso: PIN e posizione

`middleware.js` (con i moduli in `accesso/`) protegge tutto il sito:

- **PIN** obbligatorio. Si cambia da `/admin` o dal comando rapido (`POST /api/pin`). Si trova, in ordine: nell’archivio Redis, in Global Config, nella variabile `SITE_PIN`, oppure è quello predefinito.
- **Controllo della posizione** (da attivare in `/admin`): si entra solo con il telefono entro il raggio scelto dal centro della villa (predefinito 300 m da via Medici 6, Briosco). L’accesso dura il numero di ore scelto (predefinito 4), poi si rifà.
- **Dispositivi autorizzati senza GPS**: dall’amministrazione si può consentire a un singolo dispositivo di entrare da ovunque.
- **Registro degli accessi**: data, esito, distanza, posizione, tipo di dispositivo e città della rete; conservato 30 giorni.
- La pagina `/admin` è solo in italiano; si apre con il link personale che contiene la chiave (`PIN_ADMIN_KEY`).

Archivio: Upstash Redis collegato dal Marketplace di Vercel (variabili `KV_REST_API_URL` e `KV_REST_API_TOKEN`, oppure `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`). Senza archivio il sito funziona solo con il PIN.

## Avvio locale

```bash
npm install
npm run dev
```
