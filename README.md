# Suoni e Emozioni: sito del museo

Sito statico in Astro organizzato per **sale** (50, su tre piani, divise in 5 sezioni), con i video collegati a ciascuna sala.

## Pagine

| Indirizzo | Contenuto |
|---|---|
| `/` | Apertura con lo «spettro» delle 50 sale, il percorso per sezioni, gli ultimi video |
| `/sale/` | Elenco di tutte le sale, con ricerca e filtro per piano |
| `/sale/12/` | Singola sala: testo, video, sale vicine, navigazione precedente/successiva |
| `/video/` | Catalogo video con ricerca e filtro per sala |
| `/video/<slug>/` | Singolo video con il link alla sua sala |

L’indirizzo di ogni sala è il suo numero: `/sale/12/` è stabile e si può stampare come **codice QR** sul cartello della sala. In alto c’è sempre la casella **Sala n°** per saltare a una sala scrivendone il numero.

## Contenuti

Tutto si modifica nei file JSON in `src/data/`, senza toccare il codice.

- `sezioni.json`: le 5 sezioni del percorso (`id`, `nome`, `descrizione`, `colore` per il tema chiaro, `coloreScuro` per il tema scuro).
- `sale.json`: le 50 sale. Campi: `numero`, `titolo`, `sezione` (id della sezione), `piano` (0, 1, 2), `descrizione`, `immagine` (facoltativa, es. `/images/sala-12.jpg` in `public/images/`).
- `videos.json`: i video. Rispetto a prima c’è il campo **`sala`** con il numero della sala. Per YouTube usa l’URL embed `https://www.youtube-nocookie.com/embed/VIDEO_ID`.

I titoli e i testi delle sale attuali sono **segnaposto** da sostituire con quelli curatoriali. Per aggiungere sale basta aggiungere oggetti in `sale.json`; i nomi dei piani sono in `src/lib/museo.ts`.

## Avvio locale

```bash
npm install
npm run dev
```

## Pubblicazione

Il sito è pubblicato su Vercel all’indirizzo https://www.suoniemozioni.it: ogni push su `main` lo aggiorna automaticamente.
Vercel serve il sito dalla radice, quindi non serve alcuna configurazione aggiuntiva.
