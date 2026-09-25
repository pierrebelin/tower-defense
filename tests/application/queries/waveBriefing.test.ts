import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { waveBriefing } from '../../../src/application/queries/waveBriefing';
import { newWorld } from '../../support/helpers';

describe('waveBriefing', () => {
  it('annonce la créature, le nombre et les PV de la prochaine vague', () => {
    const w = newWorld();
    const b = waveBriefing(w)!;
    expect(b.wave).toBe(0);
    expect(b.creep.id).toBe('rat');
    expect(b.count).toBe(12);
    dispatch(w, { c: 'callWave' });
    w.step();
    expect(w.creeps[0].maxHp).toBe(b.hp);
  });

  it('ne renvoie rien quand la dernière vague de la campagne est lancée', () => {
    const w = newWorld();
    w.wave = w.campaignLength - 1;
    expect(waveBriefing(w)).toBeNull();
  });
});
