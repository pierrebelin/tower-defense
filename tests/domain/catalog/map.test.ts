import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { MAP_CROSSING, MAP_SEALS, MAP_SPIRAL, MAPS } from '../../../src/domain/catalog/map';
import { World } from '../../../src/domain/model/World';
import type { Difficulty } from '../../../src/domain/model/types';
import { newWorld } from '../../support/helpers';

describe('MAPS', () => {
  it.each(MAPS.map((m) => [m.name, m] as const))(
    '[RM-05] trouve un chemin pour chaque tronçon quand la carte n’a aucune tour (%s)',
    (_name, map) => {
      const w = new World({ map, difficulty: 'normal', seed: 1 });
      for (const s of w.grid.spawnCells) expect(w.fields[0].dist[s]).toBeLessThan(Infinity);
      for (let k = 0; k < w.grid.checkpoints.length; k++) {
        for (const c of w.grid.checkpoints[k]) expect(w.fields[k + 1].dist[c]).toBeLessThan(Infinity);
      }
    },
  );

  it.each(MAPS.map((m) => [m.name, m] as const))(
    '[RM-05] rend non constructibles le portail, les pierres et la porte (%s)',
    (_name, map) => {
      const w = new World({ map, difficulty: 'normal', seed: 1 });
      const cells = [...w.grid.spawnCells, ...w.grid.checkpoints.flat(), ...w.grid.exitCells];
      for (const c of cells) expect(w.grid.buildable(c)).toBe(false);
    },
  );

  it.each(MAPS.map((m) => [m.name, m] as const))(
    '[RM-05] numérote les pierres sans trou à partir de 1 (%s)',
    (_name, map) => {
      const w = new World({ map, difficulty: 'normal', seed: 1 });
      expect(w.grid.checkpoints.length).toBeGreaterThan(0);
      for (const stone of w.grid.checkpoints) expect(stone.length).toBeGreaterThan(0);
    },
  );

  it('[RM-05] propose Le Gué des Runes, La Spirale et Les Deux Sceaux aux tailles et nombres de pierres prévus', () => {
    expect(MAPS.map((m) => m.name)).toEqual(['Le Gué des Runes', 'La Spirale', 'Les Deux Sceaux']);
    expect(MAP_CROSSING.id).toBe('crossing');
    expect(new Set(MAPS.map((m) => m.id)).size).toBe(3);

    expect(MAP_CROSSING.width).toBe(36);
    expect(MAP_CROSSING.height).toBe(24);
    expect(MAP_CROSSING.rows.length).toBe(24);
    expect(MAP_CROSSING.rows[0].length).toBe(36);
    expect(new World({ map: MAP_CROSSING, difficulty: 'normal', seed: 1 }).grid.checkpoints.length).toBe(1);

    expect(MAP_SPIRAL.width).toBe(36);
    expect(MAP_SPIRAL.height).toBe(24);
    expect(MAP_SPIRAL.rows.length).toBe(24);
    expect(MAP_SPIRAL.rows[0]?.length).toBe(36);
    expect(new World({ map: MAP_SPIRAL, difficulty: 'normal', seed: 1 }).grid.checkpoints.length).toBe(1);

    expect(MAP_SEALS.width).toBe(40);
    expect(MAP_SEALS.height).toBe(24);
    expect(MAP_SEALS.rows.length).toBe(24);
    expect(MAP_SEALS.rows[0]?.length).toBe(40);
    expect(new World({ map: MAP_SEALS, difficulty: 'normal', seed: 1 }).grid.checkpoints.length).toBe(2);
  });

  it('[RM-08] démarre avec le même or et les mêmes vies sur chaque carte quand la difficulté est la même', () => {
    const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
    for (const difficulty of difficulties) {
      const worlds = MAPS.map((map) => new World({ map, difficulty, seed: 1 }));
      const [ref, ...rest] = worlds;
      for (const w of rest) {
        expect(w.gold).toBe(ref.gold);
        expect(w.lives).toBe(ref.lives);
      }
    }
  });

  it('[RM-08] lance la même première vague sur chaque carte', () => {
    const worlds = MAPS.map((map) => new World({ map, difficulty: 'normal', seed: 1 }));
    for (const w of worlds) dispatch(w, { c: 'callWave' });
    const compositions = worlds.map((w) => w.spawners.map((s) => ({ creep: s.creep, count: s.left })));
    const [ref, ...rest] = compositions;
    for (const c of rest) expect(c).toEqual(ref);
  });

  it('[CU-02] fait sortir une créature des Deux Sceaux après la pierre 1 puis la pierre 2', () => {
    const w = newWorld('normal', 42, MAP_SEALS);
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
});
