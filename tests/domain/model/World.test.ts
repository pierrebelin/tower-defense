import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { MAP_CROSSING } from '../../../src/domain/catalog/map';
import { World } from '../../../src/domain/model/World';
import { newWorld, run } from '../../support/helpers';

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
});
