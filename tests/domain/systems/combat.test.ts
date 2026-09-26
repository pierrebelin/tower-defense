import { describe, expect, it } from 'vitest';
import { applyDamage, hitCreep, updateProjectiles } from '../../../src/domain/systems/combat';
import { updateStatuses, applyOnHit } from '../../../src/domain/systems/status';
import { creepHp, spawnCreep } from '../../../src/domain/systems/waves';
import { TOWERS } from '../../../src/domain/catalog/towers';
import { CREEPS, bountyFor } from '../../../src/domain/catalog/creeps';
import type { AttackDef } from '../../../src/domain/model/types';
import { newWorld } from '../../support/helpers';

const PLAIN_ATTACK: AttackDef = {
  type: 'normal',
  dmg: [10, 10],
  cooldown: 1,
  range: 1,
  projectileSpeed: 0,
  targets: 'ground',
};

const SLOW_POISON_ATTACK: AttackDef = {
  type: 'normal',
  dmg: [10, 10],
  cooldown: 1,
  range: 1,
  projectileSpeed: 0,
  targets: 'ground',
  slow: { pct: 0.3, duration: 2 },
  poison: { dps: 5, duration: 4, maxStacks: 1 },
};

describe('combat', () => {
  it('[RM-10] n\'inflige aucun dégât aux 4 premiers coups puis blesse au 5e quand la créature a un bouclier de 4', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    c.shield = 4;
    const hp0 = c.hp;

    for (let i = 0; i < 4; i++) hitCreep(w, 1, 'archer', PLAIN_ATTACK, c, 10);
    expect(c.hp).toBe(hp0);

    hitCreep(w, 1, 'archer', PLAIN_ATTACK, c, 10);
    expect(c.hp).toBeLessThan(hp0);
  });

  it('[RM-10] n\'applique ni ralentissement ni poison quand le coup est absorbé', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    c.shield = 4;

    hitCreep(w, 1, 'archer', SLOW_POISON_ATTACK, c, 10);

    expect(c.slowPct).toBe(0);
    expect(c.poisons).toHaveLength(0);
  });

  it('[RM-10] consomme une charge par créature touchée quand un éclat de zone les atteint', () => {
    const w = newWorld();
    const a = TOWERS.cannon.attack!;
    const c1 = spawnCreep(w, 'rat', 0);
    const c2 = spawnCreep(w, 'rat', 0);
    c1.shield = 4;
    c2.shield = 4;
    c1.x = 5; c1.y = 5;
    c2.x = 5 + a.splash!.radius * 0.5; c2.y = 5;

    w.projectiles.push({
      id: w.id(), towerId: 1, attack: a, defId: 'cannon', family: 'cannon',
      x: 5, y: 5, sx: 5, sy: 5, targetId: c1.id, tx: c1.x, ty: c1.y,
      dmgRoll: 10, crit: false, alive: true,
    });

    updateProjectiles(w, 1);

    expect(c1.shield).toBe(3);
    expect(c2.shield).toBe(3);
  });

  it('[RM-10] laisse passer le poison déjà appliqué sans consommer de charge', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    c.shield = 4;
    applyOnHit(w, c, SLOW_POISON_ATTACK, 1, 'archer');
    const doseAvant = c.poisons[0].t;

    hitCreep(w, 1, 'archer', SLOW_POISON_ATTACK, c, 10);

    expect(c.shield).toBe(3);
    expect(c.poisons).toHaveLength(1);
    expect(c.poisons[0].t).toBe(doseAvant);

    const hp0 = c.hp;
    updateStatuses(w, 1);

    expect(c.hp).toBeLessThan(hp0);
    expect(c.shield).toBe(3);
  });

  it('[RM-10] fait apparaître la Garde runique avec un bouclier qui absorbe 4 coups', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'runeguard', 0);
    const hp0 = c.hp;

    for (let i = 0; i < 4; i++) hitCreep(w, 1, 'archer', PLAIN_ATTACK, c, 10);
    expect(c.hp).toBe(hp0);

    hitCreep(w, 1, 'archer', PLAIN_ATTACK, c, 10);
    expect(c.hp).toBeLessThan(hp0);
  });

  it('[RM-12] lance un sprint d\'1 s quand le Coureur est touché et que son sprint est disponible', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    c.def = { ...c.def, sprint: { mult: 2, duration: 1, cooldown: 4 } };

    hitCreep(w, 1, 'archer', PLAIN_ATTACK, c, 10);

    expect(c.sprint).toBe(1);
  });

  it('[RM-11] fait naître 2 petits Limons à la position et sur le tronçon du Limon tué', () => {
    const w = newWorld();
    const parent = spawnCreep(w, 'slime', 0);
    parent.leg = 1;
    parent.tx = 5;
    parent.ty = 7;
    parent.x = 5.5;
    parent.y = 7.5;

    applyDamage(w, parent, parent.hp, 'normal', 1, false);

    expect(w.offspring).toHaveLength(2);
    for (const child of w.offspring) {
      expect(child.def.id).toBe('slimelet');
      expect(child.x).toBe(parent.x);
      expect(child.y).toBe(parent.y);
      expect(child.leg).toBe(parent.leg);
      expect(child.tx).toBe(parent.tx);
      expect(child.ty).toBe(parent.ty);
      expect(child.wave).toBe(parent.wave);
    }
  });

  it('[RM-11] verse la prime de chaque petit Limon tué', () => {
    const w = newWorld();
    const parent = spawnCreep(w, 'slime', 0);
    applyDamage(w, parent, parent.hp, 'normal', 1, false);

    expect(w.offspring).toHaveLength(2);
    const children = [...w.offspring];
    for (const child of children) expect(child.bounty).toBeGreaterThan(0);

    for (const child of children) {
      const goldBefore = w.gold;
      applyDamage(w, child, child.hp, 'normal', 1, false);
      expect(w.gold - goldBefore).toBe(child.bounty);
    }
  });

  it('[RM-11] ne scinde pas un petit Limon tué', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'slimelet', 0);

    applyDamage(w, c, c.hp, 'normal', 1, false);

    expect(w.offspring).toHaveLength(0);
  });

  it('[RM-14] fait naître 2 têtes quand l\'Hydre passe sous 75 % de ses PV max', () => {
    const w = newWorld();
    const hydra = spawnCreep(w, 'hydra', 0);
    const dmg = hydra.maxHp * 0.3;

    applyDamage(w, hydra, dmg, 'chaos', 1, true);

    expect(w.offspring).toHaveLength(2);
    for (const child of w.offspring) {
      expect(child.def.id).toBe('hydrahead');
      expect(child.x).toBe(hydra.x);
      expect(child.y).toBe(hydra.y);
    }
  });

  it('[RM-14] fait naître 6 têtes au total quand l\'Hydre passe les trois seuils', () => {
    const w = newWorld();
    const hydra = spawnCreep(w, 'hydra', 0);

    applyDamage(w, hydra, hydra.maxHp * 0.3, 'chaos', 1, true);
    applyDamage(w, hydra, hydra.maxHp * 0.3, 'chaos', 1, true);
    applyDamage(w, hydra, hydra.maxHp * 0.3, 'chaos', 1, true);

    expect(w.offspring).toHaveLength(6);
    expect(w.offspring.every((c) => c.def.id === 'hydrahead')).toBe(true);
  });

  it('[RM-14] ne refait pas naître de têtes quand l\'Hydre régénérée repasse un seuil déjà franchi', () => {
    const w = newWorld();
    const hydra = spawnCreep(w, 'hydra', 0);

    applyDamage(w, hydra, hydra.maxHp * 0.3, 'chaos', 1, true);
    expect(w.offspring).toHaveLength(2);

    hydra.hp = hydra.maxHp;
    applyDamage(w, hydra, hydra.maxHp * 0.3, 'chaos', 1, true);

    expect(w.offspring).toHaveLength(2);
  });

  it('[RM-14] fait naître les têtes de chaque seuil quand un seul coup en franchit plusieurs', () => {
    const w = newWorld();
    const hydra = spawnCreep(w, 'hydra', 0);

    applyDamage(w, hydra, hydra.maxHp * 0.6, 'chaos', 1, true);

    expect(w.offspring).toHaveLength(4);
    expect(w.offspring.every((c) => c.def.id === 'hydrahead')).toBe(true);
  });

  it('[RM-14] fait naître des têtes aux PV et à la prime de la table, indépendants de ceux de l\'Hydre', () => {
    const w = newWorld();
    const hydra = spawnCreep(w, 'hydra', 0);

    applyDamage(w, hydra, hydra.maxHp * 0.3, 'chaos', 1, true);

    expect(w.offspring).toHaveLength(2);
    const expectedHp = creepHp(w, { ...CREEPS.hydrahead, hpFactor: 1.5 }, 0);
    const expectedBounty = bountyFor(0, { ...CREEPS.hydrahead, bountyFactor: 0.5 });
    for (const child of w.offspring) {
      expect(child.maxHp).toBe(expectedHp);
      expect(child.bounty).toBe(expectedBounty);
      expect(child.maxHp).toBeLessThan(hydra.maxHp);
    }
  });

  it('[RM-11] épargne les petits Limons quand l\'éclat de zone qui tue leur parent les atteindrait', () => {
    const w = newWorld();
    const a = TOWERS.cannon.attack!;
    const parent = spawnCreep(w, 'slime', 0);
    parent.hp = 1;
    parent.x = 5;
    parent.y = 5;

    w.projectiles.push({
      id: w.id(), towerId: 1, attack: a, defId: 'cannon', family: 'cannon',
      x: 5, y: 5, sx: 5, sy: 5, targetId: parent.id, tx: parent.x, ty: parent.y,
      dmgRoll: 999, crit: false, alive: true,
    });

    updateProjectiles(w, 1);

    expect(w.offspring).toHaveLength(2);
    expect(w.offspring.every((c) => c.hp === c.maxHp)).toBe(true);
  });
});
