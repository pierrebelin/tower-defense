import type { World } from '../../domain/model/World';

/** Trajet et longueur qu'aurait le labyrinthe si l'on construisait en (x, y). */
export function previewRoute(world: World, x: number, y: number): { route: number[][]; length: number } {
  const blocked = new Set(world.grid.footprint(x, y));
  for (const f of world.fields) f.compute(blocked);
  world.updateLegRest();
  const route = world.groundRoute();
  const length = world.mazeLength();
  world.refreshPaths();
  return { route, length };
}
