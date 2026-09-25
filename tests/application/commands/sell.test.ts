import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { newWorld } from '../../support/helpers';

describe('sell', () => {
  it('[RM-01] crédite la moitié de l\'or investi quand le joueur vend une tour améliorée', () => {
    const w = newWorld();
    const built = dispatch(w, { c: 'build', def: 'archer', x: 10, y: 8 }) as { ok: true; id: number };
    dispatch(w, { c: 'upgrade', tower: built.id, def: 'sniper' });
    const gold = w.gold;

    const r = dispatch(w, { c: 'sell', tower: built.id });

    expect(r.ok).toBe(true);
    expect(w.gold - gold).toBe(25);
  });
});
