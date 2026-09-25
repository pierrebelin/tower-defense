import type { Command, Result } from '../../domain/model/types';
import type { World } from '../../domain/model/World';
import { fail } from '../result';

export function target(world: World, cmd: Extract<Command, { c: 'target' }>): Result {
  const t = world.towerById.get(cmd.tower);
  if (!t) return fail('Tour introuvable.');
  t.targetMode = cmd.mode;
  return { ok: true };
}
