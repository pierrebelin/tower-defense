import type { Family, Tower, WaveTally } from '../model/types';

export type DebriefFamily = Exclude<Family, 'wall'> | 'hybrid';

export function familyDamage(
  towers: Iterable<Tower>,
): { family: DebriefFamily; damage: number; share: number }[] {
  const damageByFamily = new Map<DebriefFamily, number>();
  for (const t of towers) {
    if (t.def.family === 'wall') continue;
    const family: DebriefFamily = t.def.elements ? 'hybrid' : (t.def.family as DebriefFamily);
    damageByFamily.set(family, (damageByFamily.get(family) ?? 0) + t.damage);
  }

  const total = [...damageByFamily.values()].reduce((sum, d) => sum + d, 0);
  if (total === 0) return [];

  return [...damageByFamily.entries()]
    .filter(([, damage]) => damage > 0)
    .map(([family, damage]) => ({ family, damage, share: damage / total }))
    .sort((a, b) => b.damage - a.damage);
}

export function towerRanking(towers: Iterable<Tower>): Tower[] {
  return [...towers]
    .filter((t) => t.def.family !== 'wall')
    .sort((a, b) => b.damage - a.damage || a.id - b.id);
}

export function towerYield(t: Tower): number {
  return t.damage / t.spent;
}

export function breakerLosses(towers: Iterable<Tower>): { count: number; gold: number } {
  let count = 0;
  let gold = 0;
  for (const t of towers) {
    if (t.fate !== 'destroyed') continue;
    count++;
    gold += t.spent;
  }
  return { count, gold };
}

export function waveCurve(
  waves: WaveTally[],
  finalGold: number,
): { wave: number; livesLost: number; gold: number }[] {
  const curve: { wave: number; livesLost: number; gold: number }[] = [];
  waves.forEach((tally, wave) => {
    curve.push({ wave, livesLost: tally.livesLost, gold: tally.gold ?? finalGold });
  });
  return curve;
}
