import type { Result } from '../../domain/model/types';
import type { World } from '../../domain/model/World';
import { canLaunchNext, launchWave } from '../../domain/systems/waves';
import { fail } from '../result';

export function callWave(world: World): Result {
  if (!canLaunchNext(world)) return fail('Plus aucune vague à appeler.');
  const early = Number.isFinite(world.nextWaveIn) ? Math.floor(Math.max(0, world.nextWaveIn) * 0.5) : 0;
  if (early > 0) world.addGold(early);
  launchWave(world);
  return { ok: true };
}
