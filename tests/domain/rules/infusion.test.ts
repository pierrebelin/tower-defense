import { describe, expect, it } from 'vitest';
import { infusionBlocker } from '../../../src/domain/rules/infusion';
import { TOWERS } from '../../../src/domain/catalog/towers';

describe('infusionBlocker', () => {
  it("[RM-03] refuse l'infusion quand la vague 8 n'est pas lancée", () => {
    const reason = infusionBlocker(TOWERS.sniper, TOWERS.stinger, 6, [TOWERS.acid]);
    expect(reason).toBe('Infusion possible à partir de la vague 8.');
  });

  it("[RM-03] autorise l'infusion quand la vague 8 est en cours", () => {
    const reason = infusionBlocker(TOWERS.sniper, TOWERS.stinger, 7, [TOWERS.acid]);
    expect(reason).toBeNull();
  });

  it("[RM-04] refuse l'infusion quand aucune tour de l'autre famille n'atteint le niveau 2", () => {
    const reason = infusionBlocker(TOWERS.sniper, TOWERS.stinger, 7, [TOWERS.venom, TOWERS.archer, TOWERS.volley]);
    expect(reason).toBe('Il faut une tour de venom de niveau 2.');
  });

  it("[RM-04] autorise l'infusion quand un hybride contient l'autre élément", () => {
    const reason = infusionBlocker(TOWERS.sniper, TOWERS.stinger, 7, [TOWERS.stinger]);
    expect(reason).toBeNull();
  });

  it('[RM-04] autorise l’infusion quand la tour de l’autre famille est de niveau 3', () => {
    const reason = infusionBlocker(TOWERS.sniper, TOWERS.stinger, 7, [TOWERS.corrosion]);
    expect(reason).toBeNull();
  });

  it('[RM-04] nomme la famille manquante dans le message de refus', () => {
    const reason = infusionBlocker(TOWERS.acid, TOWERS.stinger, 7, []);
    expect(reason).toBe('Il faut une tour de archer de niveau 2.');
  });
});
