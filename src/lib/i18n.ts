import type { Sala, Sezione, Scheda } from './museo';
export type Lingua = 'it' | 'en';

const D = {
  it: {
    sottotitolo: 'Invito all’arte e alla musica a Villa Medici Giulini',
    descrizioneSito: (n: number) => `Le ${n} sale di Villa Medici Giulini a Briosco: strumenti musicali, arredi e opere d’arte.`,
    vaiContenuto: 'Vai al contenuto', navPrincipale: 'Navigazione principale',
    nav: { sale: 'Le sale', teatrino: 'Teatrino', giardino: 'Giardino', ascolta: 'Ascolta gli strumenti' },
    sala: 'Sala', sale: 'Sale', vai: 'Vai', numero: 'n°', erroreNumero: (m: number) => `Scrivi un numero da 1 a ${m}`,
    altraLingua: 'English', altraLinguaNome: 'Read in English',
    indirizzo: 'Villa Medici Giulini, via Medici 6, 20836 Briosco (MB)',
    crediti: 'Fotografie dal volume Suoni ed emozioni (Villa Medici Giulini, 2026): Ignazio Parravicini di Parravicino, Luca Sala, Enza Tamborra.',
    diritti: '© Villa Medici Giulini S.r.l. Proprietà artistica e letteraria riservata per tutti i paesi. Ogni riproduzione, anche parziale, è vietata.',
    // home
    altCopertina: 'La facciata di Villa Giulini oltre il giardino all’italiana',
    introHome: 'Invito all’arte e alla musica a Villa Medici Giulini, Briosco. Cinquanta sale dove gli strumenti della collezione abitano tra dipinti, porcellane, lumiere e arredi.',
    percorso: 'Il percorso, sala per sala', percorsoTesto: 'Le sale si susseguono in ordine numerico, in senso orario, come nel volume. Scorri per sfogliarle.',
    precedenti: 'Sale precedenti', successive: 'Sale successive', edifici: 'Cinque luoghi della dimora',
    teatrinoGiardino: 'Il Teatrino e il giardino', teatrino: 'Il Teatrino', teatrinoTesto: 'Il punto finale dell’itinerario nel mondo della musica.',
    giardino: 'Il giardino incantato', giardinoTesto: 'Fioriture, colori d’autunno e musica all’aperto.',
    fotoInArrivo: 'Fotografie in arrivo',
    // elenco sale
    leSale: (n: number) => `Le ${n} sale`, leSaleTesto: 'Nell’ordine della visita, divise per edificio. Il numero è lo stesso del cartello in sala e delle planimetrie del volume.',
    cercaSala: 'Cerca una sala', cercaPlaceholder: 'Cerca per nome, per esempio organo o camera',
    trovate: (n: number) => (n === 1 ? '1 sala trovata' : `${n} sale trovate`),
    nessunaSala: 'Nessuna sala corrisponde alla ricerca. Prova con un’altra parola, oppure scrivi il numero nella casella Sala in alto.',
    // sala
    fotoDalVolume: 'Fotografia dal volume Suoni ed emozioni', dalVolume: 'Dal volume Suoni ed emozioni',
    strumentiArredi: 'Strumenti e arredi', ascolta: 'Ascolta', ascoltaStrumento: 'Ascolta lo strumento', schedaStrumento: 'Scheda dello strumento', audioInArrivo: 'audio in arrivo', ascoltaTitolo: 'Apre la pagina dello strumento su Alla ricerca dei suoni perduti',
    schede: 'Le schede delle opere', schedeNota: 'Tocca un titolo per leggere la scheda del catalogo con le fotografie.',
    strumentiSala: 'Gli strumenti della sala', nellaSala: 'Nella sala', scheda: 'Scheda',
    fotoNota: 'Le fotografie di questa sala saranno pubblicate con la versione definitiva del volume.',
    passo: 'Sala precedente e successiva', inizio: 'Inizio', tutteLeSale: 'Tutte le sale', fine: 'Fine del percorso',
    testoNonTradotto: '',
    // speciali
    testoFotoVolume: 'Testo e fotografie dal volume Suoni ed emozioni.', fotografie: 'Fotografie',
    teatrinoIntro: 'Il cuore della fiaba musicale di Villa Giulini, dove gli strumenti storici incontrano il pubblico.',
    giardinoIntro: 'Si entra dal cancellino nella siepe di carpini e compare il giardino all’italiana.',
    // galleria
    ingrandisci: (i: number, n: number) => `Ingrandisci la fotografia ${i} di ${n}`, ingrandita: 'Fotografia ingrandita',
    chiudi: 'Chiudi', fotoPrec: 'Fotografia precedente', fotoSucc: 'Fotografia successiva',
    // 404
    nonTrovata: 'Questa pagina non esiste',
  },
  en: {
    sottotitolo: 'An invitation to art and music at Villa Medici Giulini',
    descrizioneSito: (n: number) => `The ${n} rooms of Villa Medici Giulini in Briosco: musical instruments, furnishings and works of art.`,
    vaiContenuto: 'Skip to content', navPrincipale: 'Main navigation',
    nav: { sale: 'The rooms', teatrino: 'Teatrino', giardino: 'Garden', ascolta: 'Listen to the instruments' },
    sala: 'Room', sale: 'Rooms', vai: 'Go', numero: 'no.', erroreNumero: (m: number) => `Enter a number from 1 to ${m}`,
    altraLingua: 'Italiano', altraLinguaNome: 'Leggi in italiano',
    indirizzo: 'Villa Medici Giulini, via Medici 6, 20836 Briosco (MB), Italy',
    crediti: 'Photographs from the book Suoni ed emozioni (Villa Medici Giulini, 2026): Ignazio Parravicini di Parravicino, Luca Sala, Enza Tamborra.',
    diritti: '© Villa Medici Giulini S.r.l. Artistic and literary rights reserved for all countries. Any reproduction, even partial, is prohibited.',
    altCopertina: 'The façade of Villa Giulini beyond the Italian garden',
    introHome: 'An invitation to art and music at Villa Medici Giulini, Briosco. Fifty rooms where the instruments of the collection live among paintings, porcelain, chandeliers and furniture.',
    percorso: 'The visit, room by room', percorsoTesto: 'The rooms follow one another in numerical order, clockwise, as in the book. Scroll to browse them.',
    precedenti: 'Previous rooms', successive: 'Next rooms', edifici: 'Five places of the residence',
    teatrinoGiardino: 'The Teatrino and the garden', teatrino: 'The Teatrino', teatrinoTesto: 'The final stop of the journey into the world of music.',
    giardino: 'The enchanted garden', giardinoTesto: 'Blossoms, autumn colours and music in the open air.',
    fotoInArrivo: 'Photographs coming soon',
    leSale: (n: number) => `The ${n} rooms`, leSaleTesto: 'In the order of the visit, grouped by building. The number is the same as on the sign in the room and on the floor plans of the book.',
    cercaSala: 'Search for a room', cercaPlaceholder: 'Search by name, for example organ or bedroom',
    trovate: (n: number) => (n === 1 ? '1 room found' : `${n} rooms found`),
    nessunaSala: 'No room matches your search. Try another word, or enter the number in the Room box at the top.',
    fotoDalVolume: 'Photograph from the book Suoni ed emozioni', dalVolume: 'From the book Suoni ed emozioni',
    strumentiArredi: 'Instruments and furnishings', ascolta: 'Listen', ascoltaStrumento: 'Listen to the instrument', schedaStrumento: 'Instrument page', audioInArrivo: 'audio coming soon', ascoltaTitolo: 'Opens the instrument page on In Search of Lost Sounds',
    schede: 'The catalogue entries', schedeNota: 'Tap a title to read the catalogue entry with its photographs.',
    strumentiSala: 'The instruments in the room', nellaSala: 'In the room', scheda: 'Entry',
    fotoNota: 'The photographs of this room will be published with the final edition of the book.',
    passo: 'Previous and next room', inizio: 'Start', tutteLeSale: 'All the rooms', fine: 'End of the visit',
    testoNonTradotto: 'This entry is available in Italian only.',
    testoFotoVolume: 'Text and photographs from the book Suoni ed emozioni.', fotografie: 'Photographs',
    teatrinoIntro: 'The heart of Villa Giulini’s musical fairy tale, where historic instruments meet the audience.',
    giardinoIntro: 'You enter through the small gate in the tall hornbeam hedge, and the Italian garden appears.',
    ingrandisci: (i: number, n: number) => `Enlarge photograph ${i} of ${n}`, ingrandita: 'Enlarged photograph',
    chiudi: 'Close', fotoPrec: 'Previous photograph', fotoSucc: 'Next photograph',
    nonTrovata: 'This page does not exist',
  },
} as const;

export const t = (l: Lingua) => D[l];

/** Percorso nella lingua scelta: l’italiano sta alla radice, l’inglese sotto /en. */
export function percorso(l: Lingua, path = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return l === 'en' ? (p === '/' ? '/en/' : `/en${p}`) : p;
}
export const altra = (l: Lingua): Lingua => (l === 'it' ? 'en' : 'it');

export const titoloSala = (s: Sala, l: Lingua) => (l === 'en' ? s.titoloEn : s.titolo);
export const titoloSalaAlt = (s: Sala, l: Lingua) => (l === 'en' ? s.titolo : s.titoloEn);
export const descrizioneSala = (s: Sala, l: Lingua) => (l === 'en' ? (s as any).descrizioneEn || s.descrizione : s.descrizione);
export const pianoSala = (s: Sala, l: Lingua) => (l === 'en' ? (s as any).pianoEn || s.piano : s.piano);
export const nomeSezione = (z: Sezione, l: Lingua) => (l === 'en' ? (z as any).nomeEn || z.nome : z.nome);
export const descrizioneSezione = (z: Sezione, l: Lingua) => (l === 'en' ? (z as any).descrizioneEn || z.descrizione : z.descrizione);
export function testiScheda(s: Scheda, l: Lingua) {
  const e = s as any;
  if (l === 'it') return { titolo: s.titolo, dettagli: s.dettagli, testo: s.testo, soloItaliano: false };
  const testo = e.testoEn?.length ? e.testoEn : s.testo;
  return { titolo: e.titoloEn || s.titolo, dettagli: e.dettagliEn ?? s.dettagli, testo, soloItaliano: !e.testoEn?.length && s.testo.length > 0 };
}

// Nomi degli strumenti in inglese (solo i tipi; costruttori e città restano come sono)
const TIPI: [RegExp, string][] = [
  [/^Fortepiano a coda/, 'Grand fortepiano'], [/^Fortepiano a tavolo/, 'Square fortepiano'], [/^Fortepiano verticale/, 'Upright fortepiano'],
  [/^Fortepiano/, 'Fortepiano'], [/^Pianoforte a coda/, 'Grand piano'], [/^Pianoforte verticale/, 'Upright piano'], [/^Pianoforte/, 'Piano'],
  [/^Organo/, 'Organ'], [/^Arpa/, 'Harp'], [/^Cembalo/, 'Harpsichord'], [/^Spinetta/, 'Spinet'], [/^Salterio/, 'Psaltery'], [/^Harmonium/, 'Harmonium'],
];
export function nomeStrumento(nome: string, l: Lingua) {
  if (l === 'it') return nome;
  let n = nome;
  for (const [re, en] of TIPI) if (re.test(n)) { n = n.replace(re, en); break; }
  return n.replace(/\bseconda metà del\b/g, 'second half of the').replace(/\bprima metà del\b/g, 'first half of the').replace(/\bsecolo\b/g, 'century').replace(/\bca\.\s/g, 'about ');
}
