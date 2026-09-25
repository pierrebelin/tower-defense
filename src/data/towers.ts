import type { TowerDef } from '../sim/types';

// Arbre technologique. Chaque tour de base (niveau 1) se divise en deux
// branches au niveau 2, chacune avec une évolution finale au niveau 3.
// Le mur de pierre sert à bâtir le labyrinthe à bas prix et peut être
// transformé plus tard en n'importe quelle tour de niveau 1.

const T: TowerDef[] = [
  {
    id: 'wall', name: 'Mur de pierre', family: 'wall', tier: 0, cost: 3,
    desc: "Bloc de labyrinthe bon marché. N'attaque pas, mais peut devenir n'importe quelle tour de base.",
    upgrades: ['archer', 'cannon', 'frost', 'storm', 'venom'],
  },

  // Archers : perçant, touche le sol et l'air.
  {
    id: 'archer', name: "Tour d'archers", family: 'archer', tier: 1, cost: 10,
    desc: 'Tirs rapides et perçants. Touche les volants. Efficace contre les armures légères.',
    attack: { type: 'pierce', dmg: [7, 9], cooldown: 0.8, range: 4.5, projectileSpeed: 16, targets: 'both' },
    upgrades: ['sniper', 'volley'],
  },
  {
    id: 'sniper', name: 'Tour de guet', family: 'archer', tier: 2, cost: 40,
    desc: 'Longue portée, tirs lourds et coups critiques.',
    attack: { type: 'pierce', dmg: [40, 50], cooldown: 1.5, range: 7.5, projectileSpeed: 26, targets: 'both', crit: { chance: 0.2, mult: 2.5 } },
    upgrades: ['hawkeye'],
  },
  {
    id: 'hawkeye', name: 'Œil du faucon', family: 'archer', tier: 3, cost: 120,
    desc: 'Portée immense. Un quart des tirs infligent le triple de dégâts.',
    attack: { type: 'pierce', dmg: [150, 180], cooldown: 1.5, range: 9.5, projectileSpeed: 32, targets: 'both', crit: { chance: 0.25, mult: 3 } },
    upgrades: [],
  },
  {
    id: 'volley', name: 'Tour à volées', family: 'archer', tier: 2, cost: 35,
    desc: 'Tire sur trois cibles à la fois.',
    attack: { type: 'pierce', dmg: [12, 15], cooldown: 0.7, range: 5, projectileSpeed: 18, targets: 'both', multishot: 3 },
    upgrades: ['arrowstorm'],
  },
  {
    id: 'arrowstorm', name: 'Pluie de flèches', family: 'archer', tier: 3, cost: 110,
    desc: 'Cinq flèches par salve, cadence élevée.',
    attack: { type: 'pierce', dmg: [30, 36], cooldown: 0.5, range: 5.5, projectileSpeed: 20, targets: 'both', multishot: 5 },
    upgrades: [],
  },

  // Canons : siège, zone, sol uniquement (sauf la branche anti-aérienne).
  {
    id: 'cannon', name: 'Canon', family: 'cannon', tier: 1, cost: 20,
    desc: 'Boulets à dégâts de zone. Sol uniquement. Redoutable contre les golems fortifiés.',
    attack: { type: 'siege', dmg: [18, 24], cooldown: 1.5, range: 4, projectileSpeed: 9, targets: 'ground', splash: { radius: 1.3, falloff: 0.5 } },
    upgrades: ['mortar', 'flak'],
  },
  {
    id: 'mortar', name: 'Mortier', family: 'cannon', tier: 2, cost: 50,
    desc: 'Grande portée et large zone d’impact.',
    attack: { type: 'siege', dmg: [55, 70], cooldown: 2.2, range: 6.5, projectileSpeed: 8, targets: 'ground', splash: { radius: 2, falloff: 0.5 } },
    upgrades: ['bombard'],
  },
  {
    id: 'bombard', name: 'Bombarde', family: 'cannon', tier: 3, cost: 140,
    desc: 'Chaque obus ravage un groupe entier.',
    attack: { type: 'siege', dmg: [170, 210], cooldown: 2.3, range: 7, projectileSpeed: 9, targets: 'ground', splash: { radius: 2.5, falloff: 0.45 } },
    upgrades: [],
  },
  {
    id: 'flak', name: 'Canon anti-aérien', family: 'cannon', tier: 2, cost: 45,
    desc: 'Éclats perçants contre les volants uniquement.',
    attack: { type: 'pierce', dmg: [45, 55], cooldown: 1, range: 6, projectileSpeed: 18, targets: 'air', splash: { radius: 1.5, falloff: 0.5 } },
    upgrades: ['skybattery'],
  },
  {
    id: 'skybattery', name: 'Batterie céleste', family: 'cannon', tier: 3, cost: 130,
    desc: 'Rien ne vole longtemps à sa portée.',
    attack: { type: 'pierce', dmg: [150, 180], cooldown: 0.9, range: 7.5, projectileSpeed: 22, targets: 'air', splash: { radius: 2, falloff: 0.5 } },
    upgrades: [],
  },

  // Givre : magique, ralentit. Sans effet sur les immunisés à la magie.
  {
    id: 'frost', name: 'Tour de givre', family: 'frost', tier: 1, cost: 16,
    desc: 'Ralentit sa cible de 30 %. Magique : inefficace contre les spectres.',
    attack: { type: 'magic', dmg: [6, 8], cooldown: 1, range: 4, projectileSpeed: 12, targets: 'both', slow: { pct: 0.3, duration: 2 } },
    upgrades: ['glacier', 'iceshard'],
  },
  {
    id: 'glacier', name: 'Glacier', family: 'frost', tier: 2, cost: 45,
    desc: 'Ralentissement de zone de 40 %.',
    attack: { type: 'magic', dmg: [16, 20], cooldown: 1.2, range: 4.5, projectileSpeed: 11, targets: 'both', splash: { radius: 1.6, falloff: 0.2 }, slow: { pct: 0.4, duration: 2.5 } },
    upgrades: ['winterheart'],
  },
  {
    id: 'winterheart', name: "Cœur de l'hiver", family: 'frost', tier: 3, cost: 120,
    desc: 'Fige des vagues entières à 55 %.',
    attack: { type: 'magic', dmg: [45, 55], cooldown: 1.1, range: 5, projectileSpeed: 12, targets: 'both', splash: { radius: 2.3, falloff: 0.2 }, slow: { pct: 0.55, duration: 2.5 } },
    upgrades: [],
  },
  {
    id: 'iceshard', name: 'Éclat de glace', family: 'frost', tier: 2, cost: 45,
    desc: 'Pointes de glace lourdes, ralentissement de 35 %.',
    attack: { type: 'magic', dmg: [40, 50], cooldown: 1.1, range: 5, projectileSpeed: 16, targets: 'both', slow: { pct: 0.35, duration: 2 } },
    upgrades: ['frostlance'],
  },
  {
    id: 'frostlance', name: 'Lance de givre', family: 'frost', tier: 3, cost: 130,
    desc: 'Transperce les armures lourdes et ralentit de 45 %.',
    attack: { type: 'magic', dmg: [160, 190], cooldown: 1.1, range: 6, projectileSpeed: 20, targets: 'both', slow: { pct: 0.45, duration: 2.2 } },
    upgrades: [],
  },

  // Foudre : magique, instantané, rebondit.
  {
    id: 'storm', name: 'Tour de foudre', family: 'storm', tier: 1, cost: 22,
    desc: 'Éclair instantané qui rebondit sur 3 cibles.',
    attack: { type: 'magic', dmg: [14, 18], cooldown: 1.3, range: 4, projectileSpeed: 0, targets: 'both', chain: { bounces: 3, range: 2.5, decay: 0.8 } },
    upgrades: ['tempest', 'obelisk'],
  },
  {
    id: 'tempest', name: "Tour d'orage", family: 'storm', tier: 2, cost: 55,
    desc: 'Chaîne d’éclairs sur 5 cibles.',
    attack: { type: 'magic', dmg: [36, 44], cooldown: 1.3, range: 4.5, projectileSpeed: 0, targets: 'both', chain: { bounces: 5, range: 2.8, decay: 0.85 } },
    upgrades: ['maelstrom'],
  },
  {
    id: 'maelstrom', name: 'Maelström', family: 'storm', tier: 3, cost: 150,
    desc: 'Huit rebonds, presque sans perte.',
    attack: { type: 'magic', dmg: [95, 115], cooldown: 1.2, range: 5, projectileSpeed: 0, targets: 'both', chain: { bounces: 8, range: 3, decay: 0.9 } },
    upgrades: [],
  },
  {
    id: 'obelisk', name: 'Obélisque arcanique', family: 'storm', tier: 2, cost: 55,
    desc: 'Frappe unique et massive. Double dégâts contre les armures lourdes.',
    attack: { type: 'magic', dmg: [75, 95], cooldown: 1.4, range: 5.5, projectileSpeed: 0, targets: 'both' },
    upgrades: ['voidprism'],
  },
  {
    id: 'voidprism', name: 'Prisme du néant', family: 'storm', tier: 3, cost: 160,
    desc: 'Dégâts chaotiques : ignorent les types d’armure et touchent les immunisés.',
    attack: { type: 'chaos', dmg: [260, 300], cooldown: 1.4, range: 6.5, projectileSpeed: 0, targets: 'both' },
    upgrades: [],
  },

  // Venin : poison cumulable, sol et air.
  {
    id: 'venom', name: 'Tour venimeuse', family: 'venom', tier: 1, cost: 14,
    desc: 'Empoisonne : 6 dégâts par seconde pendant 4 s, cumulable 3 fois. Le poison ignore la valeur d’armure.',
    attack: { type: 'normal', dmg: [3, 4], cooldown: 0.9, range: 4, projectileSpeed: 11, targets: 'both', poison: { dps: 6, duration: 4, maxStacks: 3 } },
    upgrades: ['acid', 'plague'],
  },
  {
    id: 'acid', name: 'Tour acide', family: 'venom', tier: 2, cost: 45,
    desc: 'Poison puissant qui ronge 3 points d’armure.',
    attack: { type: 'normal', dmg: [6, 8], cooldown: 0.9, range: 4.5, projectileSpeed: 12, targets: 'both', poison: { dps: 15, duration: 4, maxStacks: 3 }, armorShred: { amount: 3, duration: 4 } },
    upgrades: ['corrosion'],
  },
  {
    id: 'corrosion', name: 'Corrosion', family: 'venom', tier: 3, cost: 130,
    desc: 'Dissout 6 points d’armure : toutes les tours voisines en profitent.',
    attack: { type: 'normal', dmg: [12, 16], cooldown: 0.8, range: 5, projectileSpeed: 13, targets: 'both', poison: { dps: 42, duration: 4, maxStacks: 3 }, armorShred: { amount: 6, duration: 4 } },
    upgrades: [],
  },
  {
    id: 'plague', name: 'Nid de peste', family: 'venom', tier: 2, cost: 45,
    desc: 'Nuage toxique de zone. Sol uniquement.',
    attack: { type: 'normal', dmg: [5, 7], cooldown: 1.1, range: 4.5, projectileSpeed: 9, targets: 'ground', splash: { radius: 1.6, falloff: 0 }, poison: { dps: 11, duration: 5, maxStacks: 2 } },
    upgrades: ['blight'],
  },
  {
    id: 'blight', name: 'Fléau', family: 'venom', tier: 3, cost: 130,
    desc: 'Contamine des groupes entiers.',
    attack: { type: 'normal', dmg: [10, 14], cooldown: 1, range: 5, projectileSpeed: 10, targets: 'ground', splash: { radius: 2.3, falloff: 0 }, poison: { dps: 32, duration: 6, maxStacks: 2 } },
    upgrades: [],
  },
];

export const TOWERS: Record<string, TowerDef> = Object.fromEntries(T.map((t) => [t.id, t]));

/** Ordre du panneau de construction (touches Q W E R A S). */
export const BUILD_MENU = ['wall', 'archer', 'cannon', 'frost', 'storm', 'venom'];

export function tower(id: string): TowerDef {
  const d = TOWERS[id];
  if (!d) throw new Error(`Tour inconnue : ${id}`);
  return d;
}

/** Coût total cumulé pour atteindre cette tour depuis la racine (utile à l’affichage). */
export function totalCost(id: string): number {
  for (const d of T) if (d.upgrades.includes(id) && d.id !== 'wall') return totalCost(d.id) + tower(id).cost;
  return tower(id).cost;
}
