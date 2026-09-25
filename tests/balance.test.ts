import { describe, expect, it } from 'vitest';
import { newWorld } from './support/helpers';
import { playBot } from './support/bot';

// Un joueur automatique volontairement simple (labyrinthe fixe, aucune
// adaptation aux vagues) : il sert de plancher de difficulté.
describe('équilibrage', () => {
  for (const diff of ['easy', 'normal', 'hard'] as const) {
    it(`bot en ${diff}`, () => {
      const results = [1, 2, 3].map((seed) => playBot(newWorld(diff, seed)));
      console.log(diff, JSON.stringify(results));
      if (diff === 'easy') expect(results.every((r) => r.phase === 'victory')).toBe(true);
      if (diff === 'normal') expect(results.every((r) => r.wave >= 25)).toBe(true);
    }, 120_000);
  }
});
