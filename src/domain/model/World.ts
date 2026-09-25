import { Rng } from '../Rng';
import { CAMPAIGN_LENGTH, DIFFICULTY } from '../catalog/creeps';
import { FlowField } from '../rules/FlowField';
import { Grid } from './Grid';
import { updateCombat, updateProjectiles } from '../systems/combat';
import { updateMovement } from '../systems/movement';
import { updateStatuses } from '../systems/status';
import { updateWaves, type Spawner } from '../systems/waves';
import type { Command, Creep, Difficulty, GameEvent, MapDef, Phase, Projectile, Tower, WaveTally } from './types';

export const TICK = 1 / 60;
export const FIRST_WAVE_DELAY = 35;

export interface WorldOptions {
  map: MapDef;
  difficulty: Difficulty;
  seed: number;
}

export interface Stats {
  kills: number;
  leaked: number;
  goldEarned: number;
  towersBuilt: number;
  longestMaze: number;
  towers: Map<number, Tower>;
  waves: WaveTally[];
}

/**
 * État complet d'une partie. Avance par pas fixes de 1/60 s et ne reçoit
 * d'ordres que par `dispatch` : à graine et journal de commandes identiques,
 * la partie se rejoue à l'identique (base d'un replay ou d'un mode en ligne).
 */
export class World {
  readonly grid: Grid;
  readonly rng: Rng;
  readonly difficulty: Difficulty;
  /** Un champ par tronçon : apparition → pierre 1 → … → dernière pierre → sortie. */
  readonly fields: FlowField[];
  /** Cases cibles de chaque champ, dans le même ordre que `fields`. */
  private readonly targets: number[][];
  readonly spawnCenter: { x: number; y: number };
  readonly waypoints: { x: number; y: number }[];

  tick = 0;
  time = 0;
  phase: Phase = 'prep';
  endless = false;
  gold: number;
  lives: number;
  /** Index de la dernière vague lancée (-1 avant la première). */
  wave = -1;
  nextWaveIn = FIRST_WAVE_DELAY;
  spawners: Spawner[] = [];
  /** Créatures restantes (vivantes ou pas encore apparues) par vague. */
  pending = new Map<number, number>();

  towers: Tower[] = [];
  creeps: Creep[] = [];
  projectiles: Projectile[] = [];
  events: GameEvent[] = [];
  readonly log: { tick: number; cmd: Command }[] = [];
  stats: Stats = { kills: 0, leaked: 0, goldEarned: 0, towersBuilt: 0, longestMaze: 0, towers: new Map(), waves: [] };

  /** Longueur restante estimée après chaque tronçon (pour le ciblage). */
  legRest: number[] = [];
  airRest: number[] = [0, 0];
  private nextId = 1;
  towerById = new Map<number, Tower>();

  constructor(opts: WorldOptions) {
    this.grid = new Grid(opts.map);
    this.rng = new Rng(opts.seed);
    this.difficulty = opts.difficulty;
    const d = DIFFICULTY[opts.difficulty];
    this.gold = d.gold;
    this.lives = d.lives;
    const stones = this.grid.checkpoints.filter((s): s is number[] => !!s && s.length > 0);
    this.targets = [...stones, this.grid.exitCells];
    this.fields = this.targets.map((t) => new FlowField(this.grid, t));
    this.legRest = new Array(this.fields.length).fill(0);
    this.spawnCenter = this.grid.regionCenter(this.grid.spawnCells);
    this.waypoints = this.targets.map((t) => this.grid.regionCenter(t));
    this.airRest = new Array(this.waypoints.length).fill(0);
    for (let k = this.waypoints.length - 2; k >= 0; k--) {
      const a = this.waypoints[k];
      const b = this.waypoints[k + 1];
      this.airRest[k] = this.airRest[k + 1] + Math.hypot(a.x - b.x, a.y - b.y);
    }
    this.refreshPaths();
  }

  id(): number {
    return this.nextId++;
  }

  get campaignLength(): number {
    return CAMPAIGN_LENGTH;
  }

  /** Cellule d'apparition de référence pour mesurer le labyrinthe. */
  get spawnCell(): number {
    const c = this.spawnCenter;
    return this.grid.idx(Math.floor(c.x), Math.floor(c.y));
  }

  refreshPaths(): void {
    for (const f of this.fields) f.compute();
    const last = this.fields.length - 1;
    this.legRest[last] = 0;
    for (let k = last - 1; k >= 0; k--) {
      this.legRest[k] = this.legRest[k + 1] + this.minDist(this.fields[k + 1], this.targets[k]);
    }
    this.stats.longestMaze = Math.max(this.stats.longestMaze, this.mazeLength());
  }

  /** Longueur du trajet terrestre complet, en cases, calculée sur les champs courants. */
  mazeLength(): number {
    let len = this.fields[0].dist[this.spawnCell];
    for (let k = 1; k < this.fields.length; k++) {
      len += this.minDist(this.fields[k], this.targets[k - 1]);
    }
    return len;
  }

  minDist(field: FlowField, cells: number[]): number {
    let m = Infinity;
    for (const i of cells) m = Math.min(m, field.dist[i]);
    return m;
  }

  /** Cases du trajet terrestre actuel (pour l'aperçu du chemin) : un tracé par tronçon. */
  groundRoute(): number[][] {
    const route: number[][] = [];
    let from: number | undefined = this.spawnCell;
    for (const f of this.fields) {
      const leg: number[] = from !== undefined ? f.trace(from) : [];
      route.push(leg);
      from = leg[leg.length - 1];
    }
    return route;
  }

  emit(e: GameEvent): void {
    this.events.push(e);
  }

  drainEvents(): GameEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  addGold(n: number): void {
    this.gold += n;
    this.stats.goldEarned += n;
  }

  step(): void {
    if (this.phase === 'victory' || this.phase === 'defeat') return;
    const dt = TICK;
    this.tick++;
    this.time += dt;
    updateWaves(this, dt);
    updateStatuses(this, dt);
    updateMovement(this, dt);
    updateCombat(this, dt);
    updateProjectiles(this, dt);
    this.creeps = this.creeps.filter((c) => c.alive);
    this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  /** Une créature disparaît (tuée ou arrivée) : met à jour le décompte de sa vague. */
  creepGone(c: Creep): void {
    const left = (this.pending.get(c.wave) ?? 1) - 1;
    this.pending.set(c.wave, left);
  }

  continueEndless(): void {
    if (this.phase !== 'victory') return;
    this.endless = true;
    this.phase = 'playing';
    this.nextWaveIn = 20;
  }
}
