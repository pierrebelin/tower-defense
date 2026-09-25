import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { newWorld } from '../../support/helpers';

describe('upgrade', () => {
  it('transforme un mur en tour pour la différence de prix', () => {
    const w = newWorld();
    const r = dispatch(w, { c: 'build', def: 'wall', x: 10, y: 8 }) as { ok: true; id: number };
    const gold = w.gold;
    expect(dispatch(w, { c: 'upgrade', tower: r.id, def: 'cannon' }).ok).toBe(true);
    expect(gold - w.gold).toBe(17);
  });
});
