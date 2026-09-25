import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { refundValue } from '../../../src/domain/rules/pricing';
import { newWorld } from '../../support/helpers';

describe('pricing', () => {
  it('rembourse 100 % avant la vague, 75 % ensuite', () => {
    const w = newWorld();
    const r = dispatch(w, { c: 'build', def: 'archer', x: 10, y: 8 });
    expect(r.ok).toBe(true);
    const t = w.towerById.get((r as { id: number }).id)!;
    expect(refundValue(t)).toBe(10);
    dispatch(w, { c: 'callWave' });
    expect(refundValue(t)).toBe(7);
  });
});
