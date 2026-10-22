import { defineConfig } from 'vite';

// Content Security Policy: solo permite scripts y estilos propios, e imágenes
// y peticiones a TheMealDB. Se aplica en el build de producción porque el
// servidor de desarrollo de Vite necesita inyectar scripts propios (HMR).
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' https://www.themealdb.com data:",
  "connect-src 'self' https://www.themealdb.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export default defineConfig({
  plugins: [
    {
      name: 'csp',
      apply: 'build',
      transformIndexHtml: (html) =>
        html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
    },
  ],
});
