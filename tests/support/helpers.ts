import { MAP_CROSSING } from '../../src/domain/catalog/map';
import { World } from '../../src/domain/model/World';
import type { Difficulty } from '../../src/domain/model/types';

export function newWorld(difficulty: Difficulty = 'normal', seed = 42): World {
  return new World({ map: MAP_CROSSING, difficulty, seed });
}

export function run(world: World, seconds: number): void {
  const ticks = Math.round(seconds * 60);
  for (let i = 0; i < ticks; i++) world.step();
}
