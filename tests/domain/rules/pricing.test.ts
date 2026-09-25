import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { refundValue } from '../../../src/domain/rules/pricing';
import { newWorld } from '../../support/helpers';

describe('pricing', () => {
  it('[RM-01] rend la moitié de l\'or investi quand la tour est vendue avant la vague', () => {
    const w = newWorld();
    const r = dispatch(w, { c: 'build', def: 'archer', x: 10, y: 8 });
    expect(r.ok).toBe(true);
    const t = w.towerById.get((r as { id: number }).id)!;
    expect(refundValue(t)).toBe(5);
  });

  it('[RM-01] rend toujours la moitié quand la vague est lancée', () => {
    const w = newWorld();
    const r = dispatch(w, { c: 'build', def: 'archer', x: 10, y: 8 });
    const t = w.towerById.get((r as { id: number }).id)!;
    dispatch(w, { c: 'callWave' });
    expect(refundValue(t)).toBe(5);
  });

  it('[RM-01] compte le mur et la différence payée quand un mur transformé est vendu', () => {
    const w = newWorld();
    const r = dispatch(w, { c: 'build', def: 'wall', x: 10, y: 8 }) as { ok: true; id: number };
    dispatch(w, { c: 'upgrade', tower: r.id, def: 'cannon' });
    const t = w.towerById.get(r.id)!;
    expect(refundValue(t)).toBe(10);
  });

  it('[RM-01] arrondit à l\'or inférieur quand la moitié tombe entre deux pièces', () => {
    const w = newWorld();
    const r = dispatch(w, { c: 'build', def: 'wall', x: 10, y: 8 });
    const t = w.towerById.get((r as { id: number }).id)!;
    expect(refundValue(t)).toBe(1);
  });
});
