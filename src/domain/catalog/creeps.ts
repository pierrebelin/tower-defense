import type { CreepDef, WaveDef, Difficulty } from '../model/types';

const C: CreepDef[] = [
  { id: 'rat', name: 'Rat des marais', plural: 'Rats des marais', hpFactor: 0.7, speed: 2.2, armorType: 'unarmored', armor: 0, leak: 1, radius: 0.28, bountyFactor: 0.8 },
  { id: 'wolf', name: 'Loup gris', plural: 'Loups gris', hpFactor: 0.8, speed: 2.9, armorType: 'light', armor: 1, leak: 1, radius: 0.32, bountyFactor: 1 },
  { id: 'raider', name: 'Maraudeur', plural: 'Maraudeurs', hpFactor: 1, speed: 2, armorType: 'medium', armor: 2, leak: 1, radius: 0.34, bountyFactor: 1 },
  { id: 'troll', name: 'Troll des tourbières', plural: 'Trolls des tourbières', hpFactor: 1.05, speed: 1.9, armorType: 'medium', armor: 1, regen: 0.02, leak: 1, radius: 0.36, bountyFactor: 1.1 },
  { id: 'golem', name: 'Golem de pierre', plural: 'Golems de pierre', hpFactor: 1.6, speed: 1.45, armorType: 'fortified', armor: 4, leak: 1, radius: 0.4, bountyFactor: 1.3 },
  { id: 'knight', name: 'Colosse cuirassé', plural: 'Colosses cuirassés', hpFactor: 1.35, speed: 1.7, armorType: 'heavy', armor: 5, leak: 1, radius: 0.38, bountyFactor: 1.2 },
  { id: 'harpy', name: 'Harpie', plural: 'Harpies', hpFactor: 0.75, speed: 2.1, armorType: 'light', armor: 0, air: true, leak: 1, radius: 0.32, bountyFactor: 1 },
  { id: 'wyvern', name: 'Vouivre', plural: 'Vouivres', hpFactor: 1.05, speed: 1.9, armorType: 'medium', armor: 3, air: true, leak: 1, radius: 0.38, bountyFactor: 1.2 },
  { id: 'wraith', name: 'Spectre', plural: 'Spectres', hpFactor: 0.95, speed: 2.1, armorType: 'medium', armor: 2, magicImmune: true, leak: 1, radius: 0.33, bountyFactor: 1.1 },
  { id: 'ogre', name: 'Ogre chef de guerre', plural: 'Ogre chef de guerre', hpFactor: 22, speed: 1.35, armorType: 'hero', armor: 4, boss: true, leak: 5, radius: 0.6, bountyFactor: 18 },
  { id: 'hydra', name: 'Hydre des marais', plural: 'Hydre des marais', hpFactor: 24, speed: 1.3, armorType: 'hero', armor: 6, regen: 0.012, boss: true, leak: 5, radius: 0.65, bountyFactor: 22 },
  { id: 'ashlord', name: 'Seigneur des cendres', plural: 'Seigneur des cendres', hpFactor: 30, speed: 1.25, armorType: 'hero', armor: 8, boss: true, leak: 10, radius: 0.72, bountyFactor: 30 },
];

export const CREEPS: Record<string, CreepDef> = Object.fromEntries(C.map((c) => [c.id, c]));

const W = (creep: string, count: number, interval = 0.8): WaveDef => ({ creep, count, interval });

/** Les 30 vagues de la campagne. Au-delà : mode infini (voir waveAt). */
export const WAVES: WaveDef[] = [
  W('rat', 12), W('wolf', 12, 0.7), W('raider', 12), W('golem', 10, 1.1), W('harpy', 12),
  W('troll', 12), W('knight', 10, 1), W('wolf', 18, 0.55), W('wraith', 12), W('ogre', 1),
  W('raider', 16, 0.7), W('wyvern', 12), W('golem', 14, 1), W('rat', 30, 0.35), W('wraith', 14),
  W('knight', 14, 0.9), W('harpy', 18, 0.6), W('troll', 16, 0.7), W('wolf', 22, 0.5), W('hydra', 1),
  W('golem', 16, 0.9), W('wyvern', 16, 0.8), W('knight', 16, 0.8), W('wraith', 16, 0.7), W('troll', 20, 0.6),
  W('wolf', 26, 0.45), W('harpy', 22, 0.55), W('golem', 18, 0.8), W('knight', 20, 0.7), W('ashlord', 1),
];

export const CAMPAIGN_LENGTH = WAVES.length;

export function waveAt(index: number): WaveDef {
  if (index < WAVES.length) return WAVES[index];
  // Mode infini : on reboucle sur les vagues 11 à 30 avec plus de monstres.
  const loop = 10 + ((index - WAVES.length) % 20);
  const base = WAVES[loop];
  return { ...base, count: base.count === 1 ? 1 : Math.round(base.count * 1.2) };
}

export const DIFFICULTY: Record<Difficulty, { label: string; hp: number; lives: number; gold: number }> = {
  easy: { label: 'Recrue', hp: 0.75, lives: 30, gold: 110 },
  normal: { label: 'Vétéran', hp: 1, lives: 20, gold: 90 },
  hard: { label: 'Légende', hp: 1.4, lives: 10, gold: 85 },
};

/** PV de base d’une créature standard à la vague `index` (0 = première vague). */
export function baseHp(index: number): number {
  return Math.round(24 * Math.pow(1.155, index) + 8 * index);
}

export function bountyFor(index: number, def: CreepDef): number {
  return Math.max(1, Math.round((2 + index * 0.45) * def.bountyFactor));
}

export function clearBonus(index: number): number {
  return 10 + index * 3;
}
