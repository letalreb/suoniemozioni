import sale from '../data/sale.json';
import sezioni from '../data/sezioni.json';
import videos from '../data/videos.json';
import strumenti from '../data/strumenti.json';
import speciali from '../data/speciali.json';

export type Sezione = (typeof sezioni)[number];
export type Foto = { hero: string; heroSmall: string; w: number; h: number; pagina: number; galleria: { src: string; thumb: string; w: number; h: number; pagina: number }[] };
export type Copertina = { src: string; w: number; h: number; pagina: number; didascalia: string };
export type Sala = Omit<(typeof sale)[number], 'foto' | 'copertina'> & { foto: Foto | null; copertina: Copertina | null };
export type Strumento = (typeof strumenti)[number];
export type Video = (typeof videos)[number] & { sala?: number };

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
export const tuttiIVideo = videos as Video[];
export const tuttiGliStrumenti = strumenti as Strumento[];
export const fotoSpeciali = speciali as Record<string, Foto | null> & { testi: Record<string, string[]> };

export const sezionePer = (id: string) => tutteLeSezioni.find((s) => s.id === id)!;
export const salaPer = (n?: number | null) => tutteLeSale.find((s) => s.numero === n);
export const saleDellaSezione = (id: string) => tutteLeSale.filter((s) => s.sezione === id);
export const videoDellaSala = (n: number) => tuttiIVideo.filter((v) => v.sala === n);
export const strumentoPer = (n: number) => tuttiGliStrumenti.find((s) => s.numero === n);
export const linkSala = (n: number) => url(`/sale/${n}/`);
export const stileSezione = (s: Sezione) => `--sez:${s.colore};--sez-scuro:${s.coloreScuro}`;
export const crediti = 'Fotografie dal volume Suoni ed emozioni (Villa Medici Giulini, 2026): Ignazio Parravicini di Parravicino, Luca Sala, Enza Tamborra.';
