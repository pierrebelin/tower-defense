import { describe, expect, it } from 'vitest';
import { armorValueMultiplier, damageMultiplier } from '../src/sim/Damage';
import { refundValue } from '../src/sim/commands';
import { MAP_CROSSING } from '../src/data/map';
import { World } from '../src/sim/World';
import { newWorld, run } from './helpers';

describe('dégâts', () => {
  it('suit la formule d’armure de Warcraft III', () => {
    expect(armorValueMultiplier(0)).toBe(1);
    expect(armorValueMultiplier(10)).toBeCloseTo(1 - 0.6 / 1.6, 6);
    expect(armorValueMultiplier(-5)).toBeGreaterThan(1);
  });
  it('applique la table attaque / armure', () => {
    expect(damageMultiplier('pierce', { armorType: 'light', armor: 0 })).toBe(2);
    expect(damageMultiplier('siege', { armorType: 'fortified', armor: 0 })).toBe(1.5);
    expect(damageMultiplier('magic', { armorType: 'medium', armor: 0, magicImmune: true })).toBe(0);
    expect(damageMultiplier('chaos', { armorType: 'medium', armor: 0, magicImmune: true })).toBe(1);
  });
});

describe('labyrinthe', () => {
  it('allonge le trajet quand on construit un mur en travers', () => {
    const w = newWorld();
    const before = w.mazeLength();
    // Un rideau de murs vertical de y=1 à y=20, colonne 10 : les créatures doivent contourner par le bas.
    for (let y = 1; y <= 19; y += 2) expect(w.dispatch({ c: 'build', def: 'wall', x: 10, y }).ok).toBe(true);
    expect(w.mazeLength()).toBeGreaterThan(before + 10);
  });

  it('refuse toute construction qui fermerait le passage', () => {
    const w = newWorld('easy');
    w.gold = 10_000;
    // Mur complet sur la colonne 20 sauf la dernière case : le dernier bloc doit être refusé.
    const results = [];
    for (let y = 1; y <= 21; y += 2) results.push(w.dispatch({ c: 'build', def: 'wall', x: 20, y }));
    const last = results[results.length - 1];
    expect(last.ok).toBe(false);
    expect(Number.isFinite(w.mazeLength())).toBe(true);
  });

  it('rembourse 100 % avant la vague, 75 % ensuite', () => {
    const w = newWorld();
    const r = w.dispatch({ c: 'build', def: 'archer', x: 10, y: 8 });
    expect(r.ok).toBe(true);
    const t = w.towerById.get((r as { id: number }).id)!;
    expect(refundValue(t)).toBe(10);
    w.dispatch({ c: 'callWave' });
    expect(refundValue(t)).toBe(7);
  });

  it('transforme un mur en tour pour la différence de prix', () => {
    const w = newWorld();
    const r = w.dispatch({ c: 'build', def: 'wall', x: 10, y: 8 }) as { ok: true; id: number };
    const gold = w.gold;
    expect(w.dispatch({ c: 'upgrade', tower: r.id, def: 'cannon' }).ok).toBe(true);
    expect(gold - w.gold).toBe(17);
  });
});

describe('déroulement', () => {
  it('fait passer les créatures par la pierre runique avant la sortie', () => {
    const w = newWorld();
    w.dispatch({ c: 'callWave' });
    let sawLeg1 = false;
    for (let i = 0; i < 60 * 90 && w.stats.leaked === 0; i++) {
      w.step();
      if (w.creeps.some((c) => c.leg === 1)) sawLeg1 = true;
    }
    expect(sawLeg1).toBe(true);
    expect(w.stats.leaked).toBeGreaterThan(0);
  });

  it('est déterministe : même graine et mêmes ordres, même partie', () => {
    const play = () => {
      const w = new World({ map: MAP_CROSSING, difficulty: 'normal', seed: 7 });
      w.dispatch({ c: 'build', def: 'archer', x: 8, y: 3 });
      w.dispatch({ c: 'build', def: 'cannon', x: 12, y: 5 });
      w.dispatch({ c: 'callWave' });
      run(w, 60);
      return { gold: w.gold, kills: w.stats.kills, lives: w.lives, tick: w.tick };
    };
    expect(play()).toEqual(play());
  });

  it('rejoue une partie à partir du journal de commandes', () => {
    const a = newWorld('normal', 99);
    a.dispatch({ c: 'build', def: 'frost', x: 8, y: 3 });
    run(a, 3);
    a.dispatch({ c: 'callWave' });
    run(a, 10);
    a.dispatch({ c: 'build', def: 'storm', x: 14, y: 3 });
    run(a, 30);

    const b = newWorld('normal', 99);
    const log = [...a.log];
    while (b.tick < a.tick) {
      while (log.length && log[0].tick === b.tick) b.dispatch(log.shift()!.cmd);
      b.step();
    }
    expect(b.gold).toBe(a.gold);
    expect(b.stats.kills).toBe(a.stats.kills);
    expect(b.creeps.map((c) => Math.round(c.hp))).toEqual(a.creeps.map((c) => Math.round(c.hp)));
  });
});
