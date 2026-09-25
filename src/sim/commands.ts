import { BUILD_MENU, TOWERS } from '../data/towers';
import type { World } from './World';
import { canLaunchNext, launchWave } from './systems/waves';
import type { Command, Result, Tower, TowerDef } from './types';

const fail = (reason: string): Result => ({ ok: false, reason });

export const REFUND_RATE = 0.75;

export function upgradeCost(from: TowerDef, to: TowerDef): number {
  // Un mur transformé en tour : on ne paie que la différence.
  return from.family === 'wall' ? Math.max(0, to.cost - from.cost) : to.cost;
}

export function refundValue(t: Tower): number {
  return Math.floor(t.freshSpent + (t.spent - t.freshSpent) * REFUND_RATE);
}

/**
 * Vérifie qu'une tour peut être posée en (x, y) : terrain constructible,
 * aucune créature dessous, et surtout le labyrinthe ne doit jamais être
 * fermé — ni pour le trajet complet, ni pour une créature déjà en route.
 */
export function canBuild(world: World, defId: string, x: number, y: number): Result {
  const def = TOWERS[defId];
  if (!def || !BUILD_MENU.includes(defId)) return fail('Construction inconnue.');
  const g = world.grid;
  if (!g.inBounds(x, y) || !g.inBounds(x + 1, y + 1)) return fail('Hors de la carte.');
  const cells = g.footprint(x, y);
  if (!cells.every((i) => g.buildable(i))) return fail('Terrain non constructible.');
  if (world.gold < def.cost) return fail(`Il faut ${def.cost} pièces d'or.`);

  const fp = new Set(cells);
  for (const c of world.creeps) {
    if (!c.alive || c.def.air) continue;
    const r = c.def.radius;
    if (c.x + r > x && c.x - r < x + 2 && c.y + r > y && c.y - r < y + 2) return fail('Une créature bloque l’emplacement.');
    if (fp.has(g.idx(c.tx, c.ty))) return fail('Une créature bloque l’emplacement.');
  }
  if (!pathsStayOpen(world, fp)) return fail('Impossible de bloquer le chemin.');
  return { ok: true };
}

function pathsStayOpen(world: World, blocked: Set<number>): boolean {
  const [f0, f1] = world.fields;
  f0.compute(blocked);
  f1.compute(blocked);
  const g = world.grid;
  let ok = f0.reachable(world.spawnCell) && g.checkpointCells.some((i) => f1.reachable(i));
  if (ok) {
    for (const c of world.creeps) {
      if (!c.alive || c.def.air) continue;
      if (!world.fields[c.leg].reachable(g.idx(c.tx, c.ty))) {
        ok = false;
        break;
      }
    }
  }
  // Restaure les champs de la grille réelle.
  world.refreshPaths();
  return ok;
}

export function executeCommand(world: World, cmd: Command): Result {
  if (world.phase === 'victory' || world.phase === 'defeat') return fail('La partie est terminée.');
  switch (cmd.c) {
    case 'build': {
      const r = canBuild(world, cmd.def, cmd.x, cmd.y);
      if (!r.ok) return r;
      const def = TOWERS[cmd.def];
      const t: Tower = {
        id: world.id(), def, x: cmd.x, y: cmd.y, cx: cmd.x + 1, cy: cmd.y + 1,
        cooldown: 0.2, targetMode: 'first', spent: def.cost, freshSpent: def.cost,
        kills: 0, damage: 0, aim: -Math.PI / 2,
      };
      world.gold -= def.cost;
      world.towers.push(t);
      world.towerById.set(t.id, t);
      for (const i of world.grid.footprint(t.x, t.y)) world.grid.tower[i] = t.id;
      world.refreshPaths();
      world.stats.towersBuilt++;
      world.emit({ t: 'built', towerId: t.id, x: t.cx, y: t.cy });
      return { ok: true, id: t.id };
    }
    case 'upgrade': {
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
    case 'sell': {
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
    case 'target': {
      const t = world.towerById.get(cmd.tower);
      if (!t) return fail('Tour introuvable.');
      t.targetMode = cmd.mode;
      return { ok: true };
    }
    case 'callWave': {
      if (!canLaunchNext(world)) return fail('Plus aucune vague à appeler.');
      const early = Number.isFinite(world.nextWaveIn) ? Math.floor(Math.max(0, world.nextWaveIn) * 0.5) : 0;
      if (early > 0) world.addGold(early);
      launchWave(world);
      return { ok: true };
    }
  }
}

/** Trajet et longueur qu'aurait le labyrinthe si l'on construisait en (x, y). */
export function previewRoute(world: World, x: number, y: number): { route: number[][]; length: number } {
  const blocked = new Set(world.grid.footprint(x, y));
  const [f0, f1] = world.fields;
  f0.compute(blocked);
  f1.compute(blocked);
  const route = world.groundRoute();
  const length = f0.dist[world.spawnCell] + world.minDist(f1, world.grid.checkpointCells);
  world.refreshPaths();
  return { route, length };
}
