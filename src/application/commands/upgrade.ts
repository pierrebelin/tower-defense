import { TOWERS } from '../../domain/catalog/towers';
import type { Command, Result } from '../../domain/model/types';
import type { World } from '../../domain/model/World';
import { upgradeCost } from '../../domain/rules/pricing';
import { fail } from '../result';

export function upgrade(world: World, cmd: Extract<Command, { c: 'upgrade' }>): Result {
  const t = world.towerById.get(cmd.tower);
  if (!t) return fail('Tour introuvable.');
  if (!t.def.upgrades.includes(cmd.def)) return fail('Amélioration indisponible.');
  const to = TOWERS[cmd.def];
  const cost = upgradeCost(t.def, to);
  if (world.gold < cost) return fail(`Il faut ${cost} pièces d'or.`);
  world.gold -= cost;
  t.def = to;
  t.spent += cost;
  t.freshSpent += cost;
  t.cooldown = Math.min(t.cooldown, 0.3);
  world.emit({ t: 'upgraded', towerId: t.id });
  return { ok: true, id: t.id };
}
