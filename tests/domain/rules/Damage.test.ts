import { describe, expect, it } from 'vitest';
import { armorValueMultiplier, damageMultiplier } from '../../../src/domain/rules/Damage';

describe('Damage', () => {
  it('suit la formule d’armure de Warcraft III', () => {
    expect(armorValueMultiplier(0)).toBe(1);
    expect(armorValueMultiplier(10)).toBeCloseTo(1 - 0.6 / 1.6, 6);
    expect(armorValueMultiplier(-5)).toBeGreaterThan(1);
  });

  it('applique la table attaque / armure', () => {
    expect(damageMultiplier('pierce', { armorType: 'light', armor: 0 })).toBe(2);
    expect(damageMultiplier('siege', { armorType: 'fortified', armor: 0 })).toBe(1.5);
    expect(damageMultiplier('magic', { armorType: 'medium', armor: 0, magicImmune: true })).toBe(0);
    expect(damageMultiplier('chaos', { armorType: 'medium', armor: 0, magicImmune: true })).toBe(1);
  });
});
