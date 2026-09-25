import { TOWERS } from '../../domain/catalog/towers';
import type { World } from '../../domain/model/World';
import { infusionBlocker } from '../../domain/rules/infusion';

export function infusionLock(world: World, towerId: number, toId: string): string | null {
  const t = world.towerById.get(towerId);
  if (!t) return null;
  const to = TOWERS[toId];
  if (!to.elements || t.def.elements) return null;
  const others = world.towers.filter((o) => o.id !== t.id).map((o) => o.def);
  return infusionBlocker(t.def, to, world.wave, others);
}
