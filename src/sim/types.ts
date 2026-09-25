// Types partagés de la simulation. Aucune dépendance au DOM : tout ce qui est
// dans src/sim/ tourne aussi bien dans le navigateur que dans les tests Node.

export type AttackType = 'normal' | 'pierce' | 'siege' | 'magic' | 'chaos';
export type ArmorType = 'unarmored' | 'light' | 'medium' | 'heavy' | 'fortified' | 'hero';
export type TargetMode = 'first' | 'last' | 'strong' | 'weak' | 'close';
export type TargetLayer = 'ground' | 'air' | 'both';
export type Family = 'wall' | 'archer' | 'cannon' | 'frost' | 'storm' | 'venom';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface AttackDef {
  type: AttackType;
  dmg: [number, number];
  /** Secondes entre deux tirs. */
  cooldown: number;
  /** Portée en cases, mesurée depuis le centre de la tour. */
  range: number;
  /** Cases par seconde ; 0 = impact instantané (foudre). */
  projectileSpeed: number;
  targets: TargetLayer;
  splash?: { radius: number; falloff: number };
  slow?: { pct: number; duration: number };
  poison?: { dps: number; duration: number; maxStacks: number };
  chain?: { bounces: number; range: number; decay: number };
  multishot?: number;
  crit?: { chance: number; mult: number };
  armorShred?: { amount: number; duration: number };
}

export interface TowerDef {
  id: string;
  name: string;
  family: Family;
  tier: number;
  /** Coût de construction, ou coût incrémental d'une amélioration. */
  cost: number;
  desc: string;
  attack?: AttackDef;
  upgrades: string[];
}

export interface CreepDef {
  id: string;
  name: string;
  plural: string;
  /** Multiplicateur appliqué aux PV de base de la vague. */
  hpFactor: number;
  /** Cases par seconde. */
  speed: number;
  armorType: ArmorType;
  armor: number;
  air?: boolean;
  boss?: boolean;
  magicImmune?: boolean;
  /** Fraction des PV max régénérée par seconde. */
  regen?: number;
  /** Vies perdues si la créature atteint la sortie. */
  leak: number;
  radius: number;
  bountyFactor: number;
}

export interface WaveDef {
  creep: string;
  count: number;
  /** Secondes entre deux apparitions. */
  interval: number;
}

export type CellKind = 'build' | 'rock' | 'spawn' | 'checkpoint' | 'exit' | 'road';

export interface MapDef {
  name: string;
  width: number;
  height: number;
  rows: string[];
}

export interface Creep {
  id: number;
  def: CreepDef;
  wave: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  leg: number;
  /** Case vers laquelle la créature terrestre se dirige. */
  tx: number;
  ty: number;
  slowPct: number;
  slowTimer: number;
  shred: number;
  shredTimer: number;
  poisons: { dps: number; t: number; towerId: number; defId: string }[];
  alive: boolean;
  /** Distance restante estimée jusqu'à la sortie (pour le ciblage « premier »). */
  remaining: number;
  bob: number;
  hitFlash: number;
  bounty: number;
}

export interface Tower {
  id: number;
  def: TowerDef;
  x: number;
  y: number;
  cx: number;
  cy: number;
  cooldown: number;
  targetMode: TargetMode;
  spent: number;
  /** Or dépensé depuis le dernier lancement de vague : remboursé à 100 %. */
  freshSpent: number;
  kills: number;
  damage: number;
  aim: number;
}

export interface Projectile {
  id: number;
  towerId: number;
  attack: AttackDef;
  defId: string;
  family: Family;
  x: number;
  y: number;
  sx: number;
  sy: number;
  targetId: number;
  tx: number;
  ty: number;
  dmgRoll: number;
  crit: boolean;
  alive: boolean;
}

export type GameEvent =
  | { t: 'kill'; x: number; y: number; bounty: number; creepId: number; boss: boolean }
  | { t: 'leak'; lives: number; boss: boolean }
  | { t: 'hit'; x: number; y: number; family: Family; splash: number; crit: boolean; dmg: number }
  | { t: 'fire'; towerId: number; family: Family }
  | { t: 'chain'; points: { x: number; y: number }[] }
  | { t: 'built'; towerId: number; x: number; y: number }
  | { t: 'upgraded'; towerId: number }
  | { t: 'sold'; x: number; y: number; refund: number }
  | { t: 'waveStart'; wave: number; creep: string; boss: boolean }
  | { t: 'waveCleared'; wave: number; bonus: number; interest: number }
  | { t: 'victory' }
  | { t: 'defeat' };

export type Phase = 'prep' | 'playing' | 'victory' | 'defeat';

export type Command =
  | { c: 'build'; def: string; x: number; y: number }
  | { c: 'upgrade'; tower: number; def: string }
  | { c: 'sell'; tower: number }
  | { c: 'target'; tower: number; mode: TargetMode }
  | { c: 'callWave' };

export type Result = { ok: true; id?: number } | { ok: false; reason: string };
