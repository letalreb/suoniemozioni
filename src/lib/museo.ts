import sale from '../data/sale.json';
import sezioni from '../data/sezioni.json';
import strumenti from '../data/strumenti.json';
import speciali from '../data/speciali.json';

export type Sezione = (typeof sezioni)[number];
export type Foto = { hero: string; heroSmall: string; w: number; h: number; pagina: number; galleria: { src: string; thumb: string; w: number; h: number; pagina: number }[] };
export type Copertina = { src: string; w: number; h: number; pagina: number; didascalia: string };
export type Immagine = { src: string; w: number; h: number; pagina: number };
export type Scheda = { codice: string | null; titolo: string; dettagli: string; testo: string[]; immagini: Immagine[]; pagine: number[] };
export type Allestimento = { titolo: string; foto: { src: string; w: number; h: number } | null; sezioni: { titolo: string; voci: string[] }[]; pagine: number[] };
export type Sala = Omit<(typeof sale)[number], 'foto' | 'copertina' | 'allestimento' | 'schede'> & { foto: Foto | null; copertina: Copertina | null; allestimento: Allestimento | null; schede: Scheda[] };
export type Strumento = (typeof strumenti)[number];

export const NOME = 'Suoni ed emozioni';
export const LUOGO = 'Villa Medici Giulini';
export const TITOLO_LIBRO = 'Suoni ed emozioni';
export const SITO_ASCOLTO = 'https://www.allaricercadeisuoniperduti.com';

/** Link interno che rispetta il base path. */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
export const asset = (p: string) => (/^https?:\/\//.test(p) ? p : url(p));

export const tutteLeSale = sale as Sala[];
export const tutteLeSezioni = sezioni as Sezione[];
export const tuttiGliStrumenti = strumenti as Strumento[];
export const fotoSpeciali = speciali as Record<string, Foto | null> & { testi: Record<string, string[]> };

export const sezionePer = (id: string) => tutteLeSezioni.find((s) => s.id === id)!;
export const salaPer = (n?: number | null) => tutteLeSale.find((s) => s.numero === n);
export const saleDellaSezione = (id: string) => tutteLeSale.filter((s) => s.sezione === id);
export const strumentoPer = (n: number) => tuttiGliStrumenti.find((s) => s.numero === n);
export const linkSala = (n: number) => url(`/sale/${n}/`);
export const stileSezione = (s: Sezione) => `--sez:${s.colore};--sez-scuro:${s.coloreScuro}`;
export const crediti = 'Fotografie dal volume Suoni ed emozioni (Villa Medici Giulini, 2026): Ignazio Parravicini di Parravicino, Luca Sala, Enza Tamborra.';

// Pagine degli strumenti su «Alla ricerca dei suoni perduti».
// Il numero è quello della collezione; unica differenza nota: il pianoforte Tallone «Ravasio» (N. 80 nel volume) sul sito è il 79.
const SUONI_DIVERSI: Record<number, number> = { 80: 79 };
const SUONI_IN_ARRIVO = new Set([27, 31, 66, 67, 68, 69, 70, 71, 72, 73, 77, 80, 83, 84, 85, 86, 87, 89, 90, 91, 92]);
export function ascoltoStrumento(numero: number, lang: 'it' | 'en' = 'it') {
  const id = SUONI_DIVERSI[numero] ?? numero;
  if (!Number.isInteger(id) || id < 1 || id > 92) return null;
  return { url: `${SITO_ASCOLTO}${lang === 'en' ? '/en' : ''}/strumenti/${id}`, inArrivo: SUONI_IN_ARRIVO.has(id) };
}
