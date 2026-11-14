import { defineConfig } from 'astro/config';

// Su Vercel il sito è servito dalla radice: i valori di default vanno bene.
// BASE_PATH serve solo se un giorno lo si pubblica in una sottocartella.
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.suoniemozioni.it',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always'
});
