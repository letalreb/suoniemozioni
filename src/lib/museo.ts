import sale from '../data/sale.json';
import sezioni from '../data/sezioni.json';
import videos from '../data/videos.json';

export type Sezione = (typeof sezioni)[number];
export type Sala = (typeof sale)[number];
export type Video = (typeof videos)[number] & { sala?: number };

export const NOME_MUSEO = 'Suoni e Emozioni';

export const PIANI: Record<number, string> = {
  0: 'Piano terra',
  1: 'Primo piano',
  2: 'Secondo piano'
};

/** Link interno che rispetta il base path (necessario su GitHub Pages). */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}

/** URL di un asset in public/, oppure di un URL esterno lasciato com’è. */
export function asset(path: string): string {
  return /^https?:\/\//.test(path) ? path : url(path);
}

export const tutteLeSale = [...sale].sort((a, b) => a.numero - b.numero) as Sala[];
export const tutteLeSezioni = sezioni as Sezione[];
export const tuttiIVideo = videos as Video[];

export const sezionePer = (id: string) => tutteLeSezioni.find((s) => s.id === id)!;
export const salaPer = (numero?: number) => tutteLeSale.find((s) => s.numero === numero);
export const videoDellaSala = (numero: number) => tuttiIVideo.filter((v) => v.sala === numero);
export const saleDellaSezione = (id: string) => tutteLeSale.filter((s) => s.sezione === id);
export const linkSala = (numero: number) => url(`/sale/${numero}/`);

/** Variabili CSS col colore della sezione, chiaro e scuro. */
export const stileSezione = (s: Sezione) => `--sez:${s.colore};--sez-scuro:${s.coloreScuro}`;
