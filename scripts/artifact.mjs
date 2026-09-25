// Produit dist/artifact.html : le build autonome sans l'enveloppe <html>/<head>/<body>,
// pour une publication comme page hébergée qui fournit déjà ce squelette.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
writeFileSync('dist/artifact.html', `${head.trim()}\n${body.trim()}\n`);
console.log('dist/artifact.html écrit');
