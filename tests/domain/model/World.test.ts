import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { MAP_CROSSING, MAP_SEALS } from '../../../src/domain/catalog/map';
import { World } from '../../../src/domain/model/World';
import { spawnCreep } from '../../../src/domain/systems/waves';
import { newWorld, run } from '../../support/helpers';
import { MAP_CORRIDOR, MAP_TWO_STONES } from '../../support/maps';

describe('World', () => {
  it('fait passer les créatures par la pierre runique avant la sortie', () => {
    const w = newWorld();
    dispatch(w, { c: 'callWave' });
    let sawLeg1 = false;
    for (let i = 0; i < 60 * 90 && w.stats.leaked === 0; i++) {
      w.step();
      if (w.creeps.some((c) => c.leg === 1)) sawLeg1 = true;
    }
    expect(sawLeg1).toBe(true);
    expect(w.stats.leaked).toBeGreaterThan(0);
  });

  it('[RM-07] démarre la partie sur la carte passée en paramètre', () => {
    const w = new World({ map: MAP_SEALS, difficulty: 'normal', seed: 1 });
    expect(w.grid.w).toBe(MAP_SEALS.width);
    expect(w.grid.h).toBe(MAP_SEALS.height);
    expect(w.grid.w).not.toBe(MAP_CROSSING.width);
    expect(w.grid.checkpoints.length).toBe(2);
    expect(w.grid.spawnCells.length).toBeGreaterThan(0);
    expect(w.grid.exitCells.length).toBeGreaterThan(0);
  });

  it('est déterministe : même graine et mêmes ordres, même partie', () => {
    const play = () => {
      const w = new World({ map: MAP_CROSSING, difficulty: 'normal', seed: 7 });
      dispatch(w, { c: 'build', def: 'archer', x: 8, y: 3 });
      dispatch(w, { c: 'build', def: 'cannon', x: 12, y: 5 });
      dispatch(w, { c: 'callWave' });
      run(w, 60);
      return { gold: w.gold, kills: w.stats.kills, lives: w.lives, tick: w.tick };
    };
    expect(play()).toEqual(play());
  });

  it('rejoue une partie à partir du journal de commandes', () => {
    const a = newWorld('normal', 99);
    dispatch(a, { c: 'build', def: 'frost', x: 8, y: 3 });
    run(a, 3);
    dispatch(a, { c: 'callWave' });
    run(a, 10);
    dispatch(a, { c: 'build', def: 'storm', x: 14, y: 3 });
    run(a, 30);

    const b = newWorld('normal', 99);
    const log = [...a.log];
    while (b.tick < a.tick) {
      while (log.length && log[0].tick === b.tick) dispatch(b, log.shift()!.cmd);
      b.step();
    }
    expect(b.gold).toBe(a.gold);
    expect(b.stats.kills).toBe(a.stats.kills);
    expect(b.creeps.map((c) => Math.round(c.hp))).toEqual(a.creeps.map((c) => Math.round(c.hp)));
  });

  it('[RM-10] rejoue à l’identique une partie avec Obus cryogénique quand la graine et le journal sont les mêmes', () => {
    const play = () => {
      const w = new World({ map: MAP_CROSSING, difficulty: 'normal', seed: 11 });
      w.gold = 1000;
      const cannon = dispatch(w, { c: 'build', def: 'cannon', x: 8, y: 3 }) as { ok: true; id: number };
      expect(cannon.ok).toBe(true);
      expect(dispatch(w, { c: 'upgrade', tower: cannon.id, def: 'mortar' }).ok).toBe(true);
      const frost = dispatch(w, { c: 'build', def: 'frost', x: 12, y: 3 }) as { ok: true; id: number };
      expect(frost.ok).toBe(true);
      expect(dispatch(w, { c: 'upgrade', tower: frost.id, def: 'glacier' }).ok).toBe(true);
      w.wave = 7;
      expect(dispatch(w, { c: 'upgrade', tower: cannon.id, def: 'cryoshell' }).ok).toBe(true);
      expect(dispatch(w, { c: 'callWave' }).ok).toBe(true);
      const frozenIds = new Set<number>();
      for (let elapsed = 0; elapsed < 90; elapsed += 0.1) {
        run(w, 0.1);
        for (const c of w.creeps) if (c.frozen > 0) frozenIds.add(c.id);
      }
      return {
        gold: w.gold,
        lives: w.lives,
        frozenCount: frozenIds.size,
        creeps: w.creeps.map((c) => ({ x: c.x, y: c.y, hp: Math.round(c.hp * 100) / 100, frozen: c.frozen > 0 })),
      };
    };

    const a = play();
    const b = play();

    expect(a).toEqual(b);
    expect(a.frozenCount).toBeGreaterThan(0);
  });

  it('[RM-12] ralentit toutes les créatures touchées par les rebonds de la Grêle', () => {
    const w = new World({ map: MAP_CROSSING, difficulty: 'normal', seed: 11 });
    w.gold = 1000;
    const storm = dispatch(w, { c: 'build', def: 'storm', x: 8, y: 3 }) as { ok: true; id: number };
    expect(storm.ok).toBe(true);
    expect(dispatch(w, { c: 'upgrade', tower: storm.id, def: 'tempest' }).ok).toBe(true);
    const frost = dispatch(w, { c: 'build', def: 'frost', x: 12, y: 3 }) as { ok: true; id: number };
    expect(frost.ok).toBe(true);
    expect(dispatch(w, { c: 'upgrade', tower: frost.id, def: 'glacier' }).ok).toBe(true);
    w.wave = 7;
    expect(dispatch(w, { c: 'upgrade', tower: storm.id, def: 'hail' }).ok).toBe(true);
    expect(dispatch(w, { c: 'sell', tower: frost.id }).ok).toBe(true);
    expect(dispatch(w, { c: 'callWave' }).ok).toBe(true);

    let maxSlowedAtOnce = 0;
    for (let elapsed = 0; elapsed < 90; elapsed += 0.1) {
      run(w, 0.1);
      const slowedNow = w.creeps.filter((c) => c.slowPct > 0).length;
      if (slowedNow > maxSlowedAtOnce) maxSlowedAtOnce = slowedNow;
    }

    expect(maxSlowedAtOnce).toBeGreaterThanOrEqual(3);
  });

  it('[RM-01] fait passer une créature terrestre par la pierre 1 puis la pierre 2 avant la sortie', () => {
    const w = newWorld('normal', 42, MAP_TWO_STONES);
    dispatch(w, { c: 'callWave' });
    const legsSeen: number[] = [];
    for (let i = 0; i < 60 * 90 && w.stats.leaked === 0; i++) {
      w.step();
      const c = w.creeps[0];
      if (c && (legsSeen.length === 0 || legsSeen[legsSeen.length - 1] !== c.leg)) legsSeen.push(c.leg);
    }
    expect(legsSeen).toEqual([0, 1, 2]);
    expect(w.stats.leaked).toBeGreaterThan(0);
  });

  it('[RM-01] ne compte pas la pierre 2 quand la créature la traverse avant la pierre 1', () => {
    const w = newWorld('normal', 42, MAP_CORRIDOR);
    dispatch(w, { c: 'callWave' });
    let sawStone1 = false;
    let leg1BeforeStone1 = false;
    for (let i = 0; i < 60 * 30; i++) {
      w.step();
      const c = w.creeps[0];
      if (!c) continue;
      const onStone1 = c.tx === 10 && c.ty === 1;
      const onStone2 = c.tx === 7 && c.ty === 1;
      if (onStone2 && !sawStone1) expect(c.leg).toBe(0);
      if (onStone1) sawStone1 = true;
      if (!sawStone1 && c.leg === 1) leg1BeforeStone1 = true;
    }
    expect(sawStone1).toBe(true);
    expect(leg1BeforeStone1).toBe(false);
  });

  it('[RM-01] mesure le labyrinthe sur les trois tronçons quand la carte a deux pierres', () => {
    const w = newWorld('normal', 42, MAP_CORRIDOR);
    // portail (x=4.5) → pierre 1 (x=10.5) = 6 ; pierre 1 → pierre 2 (x=7.5) = 3 ; pierre 2 → porte (x=1.5) = 6.
    expect(w.mazeLength()).toBe(15);
  });

  it('[RM-07] rejoue à l’identique une partie à deux pierres quand carte, graine et journal sont les mêmes', () => {
    const play = () => {
      const w = new World({ map: MAP_TWO_STONES, difficulty: 'normal', seed: 7 });
      dispatch(w, { c: 'build', def: 'archer', x: 6, y: 6 });
      dispatch(w, { c: 'callWave' });
      run(w, 60);
      return { gold: w.gold, kills: w.stats.kills, lives: w.lives, tick: w.tick, leaked: w.stats.leaked };
    };
    expect(play()).toEqual(play());
  });

  it('[RM-02] fait survoler au volant la pierre 1 puis la pierre 2 avant la porte', () => {
    const w = newWorld('normal', 42, MAP_TWO_STONES);
    spawnCreep(w, 'harpy', 0);
    const stone1 = w.grid.regionCenter(w.grid.checkpoints[0]);
    const stone2 = w.grid.regionCenter(w.grid.checkpoints[1]);
    let sawStone1 = false;
    let sawStone2 = false;
    for (let i = 0; i < 60 * 60 && w.stats.leaked === 0; i++) {
      w.step();
      const c = w.creeps[0];
      if (!c) continue;
      if (!sawStone1 && Math.hypot(c.x - stone1.x, c.y - stone1.y) < 0.05) sawStone1 = true;
      if (sawStone1 && !sawStone2 && Math.hypot(c.x - stone2.x, c.y - stone2.y) < 0.05) sawStone2 = true;
    }
    expect(sawStone1).toBe(true);
    expect(sawStone2).toBe(true);
    expect(w.stats.leaked).toBeGreaterThan(0);
  });

  it('[RM-02] estime la distance restante d’un volant comme la somme des lignes droites jusqu’à la porte', () => {
    const w = newWorld('normal', 42, MAP_TWO_STONES);
    const p1 = w.grid.regionCenter(w.grid.checkpoints[0]);
    const p2 = w.grid.regionCenter(w.grid.checkpoints[1]);
    const gate = w.grid.regionCenter(w.grid.exitCells);
    const expected = [
      Math.hypot(p1.x - p2.x, p1.y - p2.y) + Math.hypot(p2.x - gate.x, p2.y - gate.y),
      Math.hypot(p2.x - gate.x, p2.y - gate.y),
      0,
    ];
    expected.forEach((v, i) => expect(w.airRest[i]).toBeCloseTo(v));
  });
});
