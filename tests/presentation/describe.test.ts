import { describe, expect, it } from 'vitest';
import type { AttackDef } from '../../src/domain/model/types';
import { applyOnHit } from '../../src/domain/systems/status';
import { spawnCreep } from '../../src/domain/systems/waves';
import type { TowerDef } from '../../src/domain/model/types';
import { creepEffects, elementsLabel, fmt1, towerInfo, towerSpecials } from '../../src/presentation/describe';
import { infusionBlocker } from '../../src/domain/rules/infusion';
import { TOWERS } from '../../src/domain/catalog/towers';
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
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    applyOnHit(w, c, attack({ slow: { pct: 0.3, duration: 2 } }), 1, 'frost');
    expect(creepEffects(c)).toEqual(['Ralenti de 30 % · encore 2 s']);
  });

  it('décrit la corrosion avec l’armure retirée et sa durée restante', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    applyOnHit(w, c, attack({ armorShred: { amount: 3, duration: 4 } }), 1, 'venom');
    expect(creepEffects(c)).toEqual(['Armure corrodée de 3 · encore 4 s']);
  });

  it('cumule les doses de poison : dégâts totaux par seconde et plus longue durée restante', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    const a = attack({ poison: { dps: 6, duration: 4, maxStacks: 3 } });
    applyOnHit(w, c, a, 1, 'venom');
    applyOnHit(w, c, a, 1, 'venom');
    expect(creepEffects(c)).toEqual(['Empoisonné · 2 doses · 12 PV/s · encore 4 s']);
  });

  it('accorde « dose » au singulier pour un seul poison', () => {
    const w = newWorld();
    const c = spawnCreep(w, 'rat', 0);
    applyOnHit(w, c, attack({ poison: { dps: 6, duration: 4, maxStacks: 3 } }), 1, 'venom');
    expect(creepEffects(c)).toEqual(['Empoisonné · 1 dose · 6 PV/s · encore 4 s']);
  });
});

const towerDef = (extra: Partial<TowerDef>): TowerDef => ({
  id: 'test', name: 'Test', family: 'cannon', tier: 1, cost: 10, desc: 'desc', upgrades: [], ...extra,
});

describe('fiche d’une tour hybride', () => {
  it('[RM-14] mentionne la chance, la durée et le répit du gel quand la tour gèle', () => {
    const def = towerDef({
      attack: attack({ freeze: { chance: 0.25, duration: 0.6, guard: 1.5 } }),
    });
    const specials = towerSpecials(def).join(' ');
    expect(specials).toContain('gèle');
    expect(specials).toContain('25 %');
    expect(specials).toContain(`${fmt1(0.6)} s`);
    expect(specials).toContain(`${fmt1(1.5)} s`);
  });

  it('[RM-14] nomme les deux éléments quand la tour est un hybride', () => {
    const def = towerDef({ elements: ['frost', 'storm'] });
    expect(elementsLabel(def)).toBe('Givre · Foudre');

    const noElements = towerDef({});
    expect(elementsLabel(noElements)).toBe('');
  });
});

describe('infusion verrouillée', () => {
  it('[RM-13] donne la raison du verrou dans l’infobulle quand l’infusion est refusée', () => {
    const def = TOWERS.cryoshell;
    const reason = infusionBlocker(TOWERS.cannon, def, 0, [])!;

    const html = towerInfo(def, def.cost, def.name, reason);
    expect(html).toContain(reason);

    const htmlSansVerrou = towerInfo(def, def.cost, def.name);
    expect(htmlSansVerrou).not.toContain(reason);
  });
});
