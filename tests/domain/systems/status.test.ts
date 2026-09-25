import { describe, expect, it } from 'vitest';
import { updateMovement } from '../../../src/domain/systems/movement';
import { applyOnHit, updateStatuses } from '../../../src/domain/systems/status';
import { spawnCreep } from '../../../src/domain/systems/waves';
import type { AttackDef } from '../../../src/domain/model/types';
import { newWorld } from '../../support/helpers';

const FREEZE_ATTACK: AttackDef = {
  type: 'magic',
  dmg: [0, 0],
  cooldown: 1,
  range: 1,
  projectileSpeed: 0,
  targets: 'ground',
  freeze: { chance: 1, duration: 0.6, guard: 1.5 },
};

const TICK = 1 / 60;

function advance(world: ReturnType<typeof newWorld>, seconds: number): void {
  const ticks = Math.round(seconds * 60);
  for (let i = 0; i < ticks; i++) {
    updateStatuses(world, TICK);
    updateMovement(world, TICK);
  }
}

describe('status', () => {
  it('[RM-07] immobilise la créature pendant la durée du gel quand la touche gèle', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    const remaining0 = c.remaining;
    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');

    advance(w, 0.3);

    expect(c.remaining).toBe(remaining0);
  });

  it('[RM-07] rend sa vitesse à la créature quand le gel expire', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    const remaining0 = c.remaining;
    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');

    advance(w, 0.7);

    expect(c.remaining).toBeLessThan(remaining0);
  });

  it('[RM-07] ne prolonge pas le gel quand une nouvelle touche arrive pendant le gel', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    const remaining0 = c.remaining;
    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');

    advance(w, 0.4);
    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');
    advance(w, 0.3);

    expect(c.remaining).toBeLessThan(remaining0);
  });

  it('[RM-08] refuse de regeler la créature quand le répit n’est pas écoulé', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');

    advance(w, 0.7);
    const remainingAtThaw = c.remaining;

    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');
    advance(w, 0.3);

    expect(c.remaining).toBeLessThan(remainingAtThaw);
  });

  it('[RM-08] regèle la créature quand le répit est écoulé', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');

    advance(w, 0.7);
    advance(w, 1.7);
    const remainingAtGuardEnd = c.remaining;

    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');
    advance(w, 0.2);

    expect(c.remaining).toBe(remainingAtGuardEnd);
  });

  it('[RM-09] ne gèle jamais un chef', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'ogre', 0);
    advance(w, 1 / 60);
    const remaining0 = c.remaining;
    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');

    advance(w, 0.3);

    expect(c.remaining).toBeLessThan(remaining0);
    expect(remaining0 - c.remaining).toBeGreaterThan(0.01);
  });

  it('[RM-09] ne gèle jamais une créature immunisée à la magie', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'wraith', 0);
    advance(w, 1 / 60);
    const remaining0 = c.remaining;
    applyOnHit(w, c, FREEZE_ATTACK, 1, 'frost');

    advance(w, 0.3);

    expect(c.remaining).toBeLessThan(remaining0);
    expect(remaining0 - c.remaining).toBeGreaterThan(0.01);
  });

  it('[RM-10] laisse la suite aléatoire intacte quand l’attaque ne gèle pas', () => {
    const NO_FREEZE_ATTACK: AttackDef = { ...FREEZE_ATTACK, freeze: undefined };

    const wOrdinaireTemoin = newWorld();
    spawnCreep(wOrdinaireTemoin, 'rat', 0);
    const wOrdinaire = newWorld();
    const cOrdinaire = spawnCreep(wOrdinaire, 'rat', 0);
    applyOnHit(wOrdinaire, cOrdinaire, NO_FREEZE_ATTACK, 1, 'frost');
    expect(wOrdinaire.rng.next()).toBe(wOrdinaireTemoin.rng.next());

    const wBossTemoin = newWorld();
    spawnCreep(wBossTemoin, 'ogre', 0);
    const wBoss = newWorld();
    const cBoss = spawnCreep(wBoss, 'ogre', 0);
    applyOnHit(wBoss, cBoss, FREEZE_ATTACK, 1, 'frost');
    expect(wBoss.rng.next()).toBe(wBossTemoin.rng.next());

    const wImmuneTemoin = newWorld();
    spawnCreep(wImmuneTemoin, 'wraith', 0);
    const wImmune = newWorld();
    const cImmune = spawnCreep(wImmune, 'wraith', 0);
    applyOnHit(wImmune, cImmune, FREEZE_ATTACK, 1, 'frost');
    expect(wImmune.rng.next()).toBe(wImmuneTemoin.rng.next());
  });
});
