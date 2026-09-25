import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { infusionLock } from '../../../src/application/queries/infusionLock';
import { newWorld } from '../../support/helpers';

describe('infusionLock', () => {
  it('[RM-13] donne la raison du refus quand l’infusion est verrouillée', () => {
    const w = newWorld();
    w.gold = 1000;
    const cannon = dispatch(w, { c: 'build', def: 'cannon', x: 10, y: 8 }) as { ok: true; id: number };
    expect(dispatch(w, { c: 'upgrade', tower: cannon.id, def: 'mortar' }).ok).toBe(true);
    w.wave = 0;

    const dispatched = dispatch(w, { c: 'upgrade', tower: cannon.id, def: 'cryoshell' });

    expect(infusionLock(w, cannon.id, 'cryoshell')).toBe((dispatched as { ok: false; reason: string }).reason);
  });

  it('[RM-13] ne verrouille pas quand l’infusion est permise ou que l’amélioration est classique', () => {
    const w = newWorld();
    w.gold = 1000;
    const cannon = dispatch(w, { c: 'build', def: 'cannon', x: 10, y: 8 }) as { ok: true; id: number };

    expect(infusionLock(w, cannon.id, 'mortar')).toBeNull();

    expect(dispatch(w, { c: 'upgrade', tower: cannon.id, def: 'mortar' }).ok).toBe(true);
    const frost = dispatch(w, { c: 'build', def: 'frost', x: 12, y: 8 }) as { ok: true; id: number };
    expect(dispatch(w, { c: 'upgrade', tower: frost.id, def: 'glacier' }).ok).toBe(true);
    w.wave = 7;

    expect(infusionLock(w, cannon.id, 'cryoshell')).toBeNull();
  });
});
