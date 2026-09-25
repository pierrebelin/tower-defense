import type { Command, Result } from '../../domain/model/types';
import type { World } from '../../domain/model/World';
import { refundValue } from '../../domain/rules/pricing';
import { fail } from '../result';

export function sell(world: World, cmd: Extract<Command, { c: 'sell' }>): Result {
  const t = world.towerById.get(cmd.tower);
  if (!t) return fail('Tour introuvable.');
  const refund = refundValue(t);
  world.gold += refund;
  world.towers = world.towers.filter((o) => o !== t);
  world.towerById.delete(t.id);
  for (const i of world.grid.footprint(t.x, t.y)) world.grid.tower[i] = 0;
  world.refreshPaths();
  world.emit({ t: 'sold', x: t.cx, y: t.cy, refund });
  return { ok: true };
}
