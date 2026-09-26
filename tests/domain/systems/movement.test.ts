import { describe, expect, it } from 'vitest';
import { updateMovement } from '../../../src/domain/systems/movement';
import { spawnCreep } from '../../../src/domain/systems/waves';
import { newWorld } from '../../support/helpers';

describe('movement', () => {
  it('[RM-12] parcourt deux fois plus de chemin pendant le sprint', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'dunerunner', 0);
    updateMovement(w, 0);
    c.sprint = 1;
    const remaining0 = c.remaining;

    const wTemoin = newWorld();
    const cTemoin = spawnCreep(wTemoin, 'dunerunner', 0);
    updateMovement(wTemoin, 0);
    const remaining0Temoin = cTemoin.remaining;

    updateMovement(w, 0.05);
    updateMovement(wTemoin, 0.05);

    const distance = remaining0 - c.remaining;
    const distanceTemoin = remaining0Temoin - cTemoin.remaining;

    expect(distance).toBeCloseTo(distanceTemoin * 2, 5);
  });

  it('[RM-13] parcourt 1,5 fois plus de chemin quand l\'Ogre est sous 50 % de ses PV max', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'ogre', 0);
    updateMovement(w, 0);
    c.hp = c.maxHp * 0.4;
    const remaining0 = c.remaining;

    const wTemoin = newWorld();
    const cTemoin = spawnCreep(wTemoin, 'ogre', 0);
    updateMovement(wTemoin, 0);
    const remaining0Temoin = cTemoin.remaining;

    updateMovement(w, 0.05);
    updateMovement(wTemoin, 0.05);

    const distance = remaining0 - c.remaining;
    const distanceTemoin = remaining0Temoin - cTemoin.remaining;

    expect(distance).toBeCloseTo(distanceTemoin * 1.5, 5);
  });
});
