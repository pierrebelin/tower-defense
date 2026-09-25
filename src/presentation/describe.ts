import { CREEPS, waveAt, baseHp, bountyFor, DIFFICULTY } from '../domain/catalog/creeps';
import { ARMOR_LABEL, ATTACK_LABEL, ATTACK_TABLE } from '../domain/rules/Damage';
import type { World } from '../domain/model/World';
import type { ArmorType, AttackType, Creep, CreepDef, TargetMode, TowerDef } from '../domain/model/types';

// Textes du panneau d'information. Tout est échappé : les seules données
// injectées viennent des fichiers de données du jeu.

const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
export const fmt1 = (n: number) => nf1.format(n);
export const fmt0 = (n: number) => nf0.format(n);
const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
/** Multiplicateurs de dégâts : ×0,75 et ×0,35 doivent rester exacts. */
export const fmtM = (n: number) => nf2.format(n);

export const TARGET_LABEL: Record<TargetMode, string> = {
  first: 'Premier', last: 'Dernier', strong: 'Plus robuste', weak: 'Plus faible', close: 'Plus proche',
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const LAYER: Record<string, string> = { ground: 'Sol', air: 'Air', both: 'Sol et air' };

function stat(label: string, value: string): string {
  return `<span><em>${label}</em>${value}</span>`;
}

export function matchupTags(type: AttackType): string {
  const row = ATTACK_TABLE[type];
  const good: string[] = [];
  const bad: string[] = [];
  for (const k of Object.keys(row) as ArmorType[]) {
    if (row[k] >= 1.25) good.push(`${ARMOR_LABEL[k]} ×${fmtM(row[k])}`);
    if (row[k] <= 0.75) bad.push(`${ARMOR_LABEL[k]} ×${fmtM(row[k])}`);
  }
  if (type === 'magic') bad.push('Immunisés ×0');
  return [...good.map((g) => `<span class="tag good">${g}</span>`), ...bad.map((b) => `<span class="tag bad">${b}</span>`)].join('');
}

export function towerSpecials(def: TowerDef): string[] {
  const a = def.attack;
  if (!a) return [];
  const s: string[] = [];
  if (a.splash) s.push(`zone ${fmt1(a.splash.radius)} cases`);
  if (a.slow) s.push(`ralentit de ${Math.round(a.slow.pct * 100)} % pendant ${fmt1(a.slow.duration)} s`);
  if (a.poison) s.push(`poison ${a.poison.dps}/s pendant ${a.poison.duration} s (×${a.poison.maxStacks})`);
  if (a.chain) s.push(`rebondit sur ${a.chain.bounces} cibles`);
  if (a.multishot) s.push(`${a.multishot} cibles par salve`);
  if (a.crit) s.push(`${Math.round(a.crit.chance * 100)} % de critiques ×${fmt1(a.crit.mult)}`);
  if (a.armorShred) s.push(`−${a.armorShred.amount} armure`);
  return s;
}

export function towerInfo(def: TowerDef, cost: number | null, heading = def.name): string {
  const a = def.attack;
  const costLine = cost !== null ? ` · ${cost} or` : '';
  if (!a) return `<h3>${esc(heading)}${costLine}</h3><p>${esc(def.desc)}</p>`;
  const dps = ((a.dmg[0] + a.dmg[1]) / 2 / a.cooldown) * (a.multishot ?? 1);
  const specials = towerSpecials(def);
  return `<h3>${esc(heading)}${costLine}</h3>
    <div class="stats">
      ${stat('Attaque', ATTACK_LABEL[a.type])}
      ${stat('Dégâts', `${a.dmg[0]}–${a.dmg[1]}`)}
      ${stat('Cadence', `${fmt1(1 / a.cooldown)}/s`)}
      ${stat('Portée', fmt1(a.range))}
      ${stat('Cibles', LAYER[a.targets])}
      ${stat('DPS', `≈ ${fmt0(dps)}`)}
    </div>
    <p>${esc(def.desc)}${specials.length ? ' ' + esc(cap(specials.join(' · '))) + '.' : ''}</p>
    <div>${matchupTags(a.type)}</div>`;
}

export function creepTags(def: CreepDef): string {
  const tags = [`<span class="tag">Armure ${ARMOR_LABEL[def.armorType].toLowerCase()} ${def.armor}</span>`];
  if (def.air) tags.push('<span class="tag air">Volant</span>');
  if (def.magicImmune) tags.push('<span class="tag bad">Immunisé à la magie</span>');
  if (def.regen) tags.push(`<span class="tag">Régénère ${fmt1(def.regen * 100)} %/s</span>`);
  if (def.boss) tags.push(`<span class="tag bad">Chef · coûte ${def.leak} vies</span>`);
  return tags.join('');
}

/** Types d'attaque les plus efficaces contre une armure donnée. */
export function counters(def: CreepDef): string {
  const types = (Object.keys(ATTACK_TABLE) as AttackType[])
    .filter((t) => t !== 'chaos' && !(t === 'magic' && def.magicImmune))
    .map((t) => [t, ATTACK_TABLE[t][def.armorType]] as const)
    .sort((a, b) => b[1] - a[1]);
  const best = types.filter(([, m]) => m >= 1.25);
  const pick = best.length ? best : types.slice(0, 1);
  return pick.map(([t, m]) => `${ATTACK_LABEL[t]} ×${fmtM(m)}`).join(', ');
}

export function nextWaveInfo(world: World): string {
  const i = world.wave + 1;
  if (!world.endless && i >= world.campaignLength) {
    return `<h3>Dernière vague lancée</h3><p>Tenez jusqu'à ce que la dernière créature tombe.</p>`;
  }
  const w = waveAt(i);
  const def = CREEPS[w.creep];
  const hp = Math.round(baseHp(i) * def.hpFactor * DIFFICULTY[world.difficulty].hp * (i >= world.campaignLength ? Math.pow(1.08, i - world.campaignLength + 1) : 1));
  const count = w.count > 1 ? ` ×${w.count}` : '';
  let hint = `Le plus efficace : ${counters(def)}.`;
  if (def.air) hint += ' Ils survolent le labyrinthe en ligne droite : seules les tours qui visent l’air les touchent.';
  if (def.magicImmune) hint += ' Givre et foudre ne leur font rien, sauf le Prisme du néant.';
  return `<h3>Prochaine vague ${i + 1} · ${esc(def.boss ? def.name : def.plural)}${count}</h3>
    <div class="stats">${stat('PV', fmt0(hp))}${stat('Vitesse', fmt1(def.speed))}${stat('Butin', `${bountyFor(i, def)} or`)}</div>
    <div>${creepTags(def)}</div>
    <p>${esc(hint)}</p>`;
}

export function creepInfo(c: Creep): string {
  return `<h3>${esc(c.def.name)} · vague ${c.wave + 1}</h3>
    <div class="stats">${stat('PV', `${fmt0(c.hp)} / ${fmt0(c.maxHp)}`)}${stat('Vitesse', fmt1(c.def.speed * (1 - c.slowPct)))}${stat('Armure', fmt0(c.def.armor - c.shred))}</div>
    <div>${creepTags(c.def)}</div>
    <p>${esc(`Le plus efficace : ${counters(c.def)}.`)}</p>`;
}
