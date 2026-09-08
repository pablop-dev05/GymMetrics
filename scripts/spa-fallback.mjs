/**
 * GitHub Pages no conoce las rutas del router: sirve 404.html cuando la URL no
 * existe como fichero. Copiando index.html a 404.html, la SPA arranca igual.
 * Además .nojekyll evita que Pages ignore ficheros que empiezan por guion bajo.
 */
import { copyFile, writeFile } from 'node:fs/promises';

const DIST = 'dist/gym-metrics/browser';

await copyFile(`${DIST}/index.html`, `${DIST}/404.html`);
await writeFile(`${DIST}/.nojekyll`, '');
console.log('✓ 404.html y .nojekyll añadidos a', DIST);
