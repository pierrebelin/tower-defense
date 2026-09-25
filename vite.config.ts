import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Un seul fichier HTML autonome : jouable hors ligne et publiable tel quel.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { target: 'es2022', assetsInlineLimit: 100_000_000 },
  test: { environment: 'node' },
});
