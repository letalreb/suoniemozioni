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

## Accesso con PIN

`middleware.js` (con i moduli in `accesso/`) protegge tutto il sito: si entra solo con il PIN, valido 30 giorni sul dispositivo. Cambiando PIN, tutti devono rientrare.

- **Amministrazione** (`/admin`, solo in italiano): accesso con Google per gli amministratori letalreb@gmail.com e info.villamedici@gmail.com (elenco in `accesso/google.js`; la variabile `ADMIN_EMAILS` su Vercel, se presente, lo sostituisce). Permette di cambiare, generare e condividere il PIN e di vedere il registro degli accessi (data, esito, tipo di dispositivo, città della rete; conservato 30 giorni).
- **Comando rapido dell’iPhone**: `POST /api/pin` con la chiave `PIN_ADMIN_KEY`.
- **Dove sta il PIN**: nell’archivio Redis, in Global Config, nella variabile `SITE_PIN`, oppure è quello predefinito.

Variabili su Vercel: `GOOGLE_CLIENT_ID` (client OAuth di tipo «Applicazione web» con origine `https://www.suoniemozioni.it`), `ADMIN_EMAILS` (facoltativa, indirizzi separati da virgola), `PIN_ADMIN_KEY` (firma delle sessioni e comando rapido), archivio Upstash Redis (`KV_REST_API_URL`, `KV_REST_API_TOKEN`).

## Avvio locale

```bash
npm install
npm run dev
```
