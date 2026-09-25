import { bountyFor, CREEPS, waveAt } from '../../domain/catalog/creeps';
import type { World } from '../../domain/model/World';
import type { CreepDef } from '../../domain/model/types';
import { canLaunchNext, creepHp } from '../../domain/systems/waves';

export interface WaveBriefing {
  wave: number;
  creep: CreepDef;
  count: number;
  /** PV d'une créature de la vague. */
  hp: number;
  bounty: number;
}

/** Ce qui attend le joueur à la prochaine vague, ou null s'il n'y en a plus. */
export function waveBriefing(world: World): WaveBriefing | null {
  if (!canLaunchNext(world)) return null;
  const wave = world.wave + 1;
  const w = waveAt(wave);
  const creep = CREEPS[w.creep];
  return { wave, creep, count: w.count, hp: creepHp(world, creep, wave), bounty: bountyFor(wave, creep) };
}
