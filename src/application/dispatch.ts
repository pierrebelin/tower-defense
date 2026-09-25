import type { Command, Result } from '../domain/model/types';
import type { World } from '../domain/model/World';
import { build } from './commands/build';
import { callWave } from './commands/callWave';
import { sell } from './commands/sell';
import { target } from './commands/target';
import { upgrade } from './commands/upgrade';
import { fail } from './result';

/** Seule porte d'entrée des ordres du joueur : chaque ordre accepté est journalisé pour le rejeu. */
export function dispatch(world: World, cmd: Command): Result {
  const r = execute(world, cmd);
  if (r.ok) world.log.push({ tick: world.tick, cmd });
  return r;
}

function execute(world: World, cmd: Command): Result {
  if (world.phase === 'victory' || world.phase === 'defeat') return fail('La partie est terminée.');
  switch (cmd.c) {
    case 'build': return build(world, cmd);
    case 'upgrade': return upgrade(world, cmd);
    case 'sell': return sell(world, cmd);
    case 'target': return target(world, cmd);
    case 'callWave': return callWave(world);
  }
}
