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

`middleware.js` chiede un PIN prima di servire qualsiasi pagina. Il PIN si può passare anche nell’indirizzo (`?PIN=…`) per l’accesso dai QR code; resta valido 30 giorni sul dispositivo. La variabile d’ambiente `SITE_PIN` su Vercel sostituisce il PIN predefinito.

## Avvio locale

```bash
npm install
npm run dev
```
