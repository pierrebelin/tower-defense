import { baseHp, bountyFor, clearBonus, CREEPS, DIFFICULTY, waveAt } from '../catalog/creeps';
import type { World } from '../model/World';
import type { Creep } from '../model/types';

export interface Spawner {
  wave: number;
  creep: string;
  left: number;
  interval: number;
  timer: number;
}

/** Délai entre la fin d'apparition d'une vague et la suivante. */
export const WAVE_GAP = 14;

export function waveDuration(index: number): number {
  const w = waveAt(index);
  return (w.count - 1) * w.interval;
}

export function canLaunchNext(world: World): boolean {
  if (world.phase !== 'prep' && world.phase !== 'playing') return false;
  return world.endless || world.wave + 1 < world.campaignLength;
}

export function launchWave(world: World): void {
  const index = world.wave + 1;
  const w = waveAt(index);
  world.wave = index;
  world.phase = 'playing';
  world.spawners.push({ wave: index, creep: w.creep, left: w.count, interval: w.interval, timer: 0 });
  world.pending.set(index, w.count);
  // Tout investissement antérieur au lancement n'est plus remboursé qu'à 75 %.
  for (const t of world.towers) t.freshSpent = 0;
  world.nextWaveIn = canLaunchNext(world) ? waveDuration(index) + WAVE_GAP : Infinity;
  world.emit({ t: 'waveStart', wave: index, creep: w.creep, boss: !!CREEPS[w.creep].boss });
}

export function spawnCreep(world: World, defId: string, wave: number): Creep {
  const def = CREEPS[defId];
  const endlessMult = wave >= world.campaignLength ? Math.pow(1.08, wave - world.campaignLength + 1) : 1;
  const hp = Math.round(baseHp(wave) * def.hpFactor * DIFFICULTY[world.difficulty].hp * endlessMult);
  const g = world.grid;
  const cell = g.spawnCells[world.rng.int(g.spawnCells.length)];
  const x = g.cx(cell) + 0.5;
  const y = g.cy(cell) + 0.5;
  const c: Creep = {
    id: world.id(), def, wave, x, y, hp, maxHp: hp, leg: 0,
    tx: g.cx(cell), ty: g.cy(cell),
    slowPct: 0, slowTimer: 0, shred: 0, shredTimer: 0, poisons: [],
    alive: true, remaining: Infinity, bob: world.rng.next() * Math.PI * 2, hitFlash: 0,
    bounty: bountyFor(wave, def),
  };
  if (def.air) {
    c.x = world.spawnCenter.x;
    c.y = world.spawnCenter.y;
  }
  world.creeps.push(c);
  return c;
}

export function updateWaves(world: World, dt: number): void {
  // Compte à rebours vers la prochaine vague.
  if (canLaunchNext(world)) {
    world.nextWaveIn -= dt;
    if (world.nextWaveIn <= 0) launchWave(world);
  }

  for (const s of world.spawners) {
    s.timer -= dt;
    while (s.left > 0 && s.timer <= 0) {
      spawnCreep(world, s.creep, s.wave);
      s.left--;
      s.timer += s.interval;
    }
  }
  world.spawners = world.spawners.filter((s) => s.left > 0);

  // Vagues terminées : prime de fin de vague et intérêts sur l'or en réserve.
  for (const [wave, left] of world.pending) {
    if (left > 0) continue;
    world.pending.delete(wave);
    if (world.phase === 'defeat') continue;
    const bonus = clearBonus(wave);
    const interest = Math.min(Math.floor(world.gold * 0.04), 20 + wave * 2);
    world.addGold(bonus + interest);
    world.emit({ t: 'waveCleared', wave, bonus, interest });
  }

  if (
    world.phase === 'playing' && !world.endless &&
    world.wave >= world.campaignLength - 1 &&
    world.spawners.length === 0 && world.creeps.length === 0 && world.pending.size === 0
  ) {
    world.phase = 'victory';
    world.emit({ t: 'victory' });
  }
}
