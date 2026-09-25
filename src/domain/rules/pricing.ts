import type { Tower, TowerDef } from '../model/types';

export const REFUND_RATE = 0.75;

export function upgradeCost(from: TowerDef, to: TowerDef): number {
  // Un mur transformé en tour : on ne paie que la différence.
  return from.family === 'wall' ? Math.max(0, to.cost - from.cost) : to.cost;
}

export function refundValue(t: Tower): number {
  return Math.floor(t.freshSpent + (t.spent - t.freshSpent) * REFUND_RATE);
}
