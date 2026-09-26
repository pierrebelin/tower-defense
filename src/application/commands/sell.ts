import type { Command, Result } from '../../domain/model/types';
import type { World } from '../../domain/model/World';
import { refundValue } from '../../domain/rules/pricing';
import { fail } from '../result';

export function sell(world: World, cmd: Extract<Command, { c: 'sell' }>): Result {
  const t = world.towerById.get(cmd.tower);
  if (!t) return fail('Tour introuvable.');
  const refund = refundValue(t);
  world.gold += refund;
  t.fate = 'sold';
  world.removeTower(t);
  world.emit({ t: 'sold', x: t.cx, y: t.cy, refund });
  return { ok: true };
}
