import type { Tower } from '../model/types';

const EPSILON = 1e-9;

/** Distance de (x, y) au centre de la case de l'emprise 2×2 de la tour la plus proche. */
function distanceToTower(t: Tower, x: number, y: number): number {
  const nearestX = x < t.x + 1 ? t.x + 0.5 : t.x + 1.5;
  const nearestY = y < t.y + 1 ? t.y + 0.5 : t.y + 1.5;
  return Math.hypot(x - nearestX, y - nearestY);
}

/** Tours à portée d'un point, les plus proches d'abord (ex æquo compris). */
export function nearestTowers(towers: Tower[], x: number, y: number, range: number): Tower[] {
  const inRange = towers
    .map((t) => ({ t, d: distanceToTower(t, x, y) }))
    .filter(({ d }) => d <= range + EPSILON);
  if (inRange.length === 0) return [];
  const min = Math.min(...inRange.map(({ d }) => d));
  return inRange.filter(({ d }) => Math.abs(d - min) <= EPSILON).map(({ t }) => t);
}
