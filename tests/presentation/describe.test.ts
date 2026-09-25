import { describe, expect, it } from 'vitest';
import type { AttackDef } from '../../src/domain/model/types';
import { applyOnHit } from '../../src/domain/systems/status';
import { spawnCreep } from '../../src/domain/systems/waves';
import { creepEffects } from '../../src/presentation/describe';
import { newWorld } from '../support/helpers';

const attack = (extra: Partial<AttackDef>): AttackDef => ({
  type: 'normal', dmg: [1, 1], cooldown: 1, range: 4, projectileSpeed: 10, targets: 'both', ...extra,
});

describe('effets subis par une créature', () => {
  it('ne liste rien quand la créature n’est affectée par aucun effet', () => {
    const c = spawnCreep(newWorld(), 'rat', 0);
    expect(creepEffects(c)).toEqual([]);
  });

  it('décrit le ralentissement avec son pourcentage et sa durée restante', () => {
    const c = spawnCreep(newWorld(), 'rat', 0);
    applyOnHit(c, attack({ slow: { pct: 0.3, duration: 2 } }), 1, 'frost');
    expect(creepEffects(c)).toEqual(['Ralenti de 30 % · encore 2 s']);
  });

  it('décrit la corrosion avec l’armure retirée et sa durée restante', () => {
    const c = spawnCreep(newWorld(), 'rat', 0);
    applyOnHit(c, attack({ armorShred: { amount: 3, duration: 4 } }), 1, 'venom');
    expect(creepEffects(c)).toEqual(['Armure corrodée de 3 · encore 4 s']);
  });

  it('cumule les doses de poison : dégâts totaux par seconde et plus longue durée restante', () => {
    const c = spawnCreep(newWorld(), 'rat', 0);
    const a = attack({ poison: { dps: 6, duration: 4, maxStacks: 3 } });
    applyOnHit(c, a, 1, 'venom');
    applyOnHit(c, a, 1, 'venom');
    expect(creepEffects(c)).toEqual(['Empoisonné · 2 doses · 12 PV/s · encore 4 s']);
  });

  it('accorde « dose » au singulier pour un seul poison', () => {
    const c = spawnCreep(newWorld(), 'rat', 0);
    applyOnHit(c, attack({ poison: { dps: 6, duration: 4, maxStacks: 3 } }), 1, 'venom');
    expect(creepEffects(c)).toEqual(['Empoisonné · 1 dose · 6 PV/s · encore 4 s']);
  });
});
