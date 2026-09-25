import type { World } from '../../domain/model/World';

/** Trajet et longueur qu'aurait le labyrinthe si l'on construisait en (x, y). */
export function previewRoute(world: World, x: number, y: number): { route: number[][]; length: number } {
  const blocked = new Set(world.grid.footprint(x, y));
  const [f0, f1] = world.fields;
  f0.compute(blocked);
  f1.compute(blocked);
  const route = world.groundRoute();
  const length = f0.dist[world.spawnCell] + world.minDist(f1, world.grid.checkpointCells);
  world.refreshPaths();
  return { route, length };
}
