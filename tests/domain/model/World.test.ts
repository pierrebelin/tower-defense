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

  it('[RM-04] note les vies perdues de la vague quand ses créatures s’échappent', () => {
    const w = newWorld();
    dispatch(w, { c: 'callWave' });
    const before = w.lives;
    for (let i = 0; i < 60 * 90 && w.stats.leaked === 0; i++) w.step();
    expect(w.stats.waves[0].livesLost).toBe(before - w.lives);
  });

  it('[RM-04] note l’or possédé après prime et intérêts quand la vague se termine', () => {
    const w = newWorld();
    dispatch(w, { c: 'callWave' });
    for (let i = 0; i < 60 * 300 && w.stats.waves[0]?.gold === null; i++) w.step();
    expect(w.stats.waves[0].gold).toBe(w.gold);
  });

  it('[RM-04] impute l’évasion à la vague de la créature quand deux vagues se chevauchent', () => {
    const w = newWorld();
    dispatch(w, { c: 'callWave' });
    dispatch(w, { c: 'callWave' });
    w.lives = 1_000_000;
    const before = w.lives;
    for (let i = 0; i < 60 * 600 && (w.pending.has(0) || w.pending.has(1)); i++) w.step();
    expect(w.pending.has(0)).toBe(false);
    expect(w.pending.has(1)).toBe(false);
    expect(w.stats.waves[0].livesLost).toBeGreaterThan(0);
    expect(w.stats.waves[1].livesLost).toBeGreaterThan(0);
    expect(w.stats.waves[0].livesLost + w.stats.waves[1].livesLost).toBe(before - w.lives);
  });

  it('[RM-04] laisse l’or non renseigné et garde les vies perdues quand la vague est en cours à la défaite', () => {
    const w = newWorld();
    dispatch(w, { c: 'callWave' });
    w.lives = 1;
    for (let i = 0; i < 60 * 90 && w.phase !== 'defeat'; i++) w.step();
    expect(w.phase).toBe('defeat');
    expect(w.stats.waves[0].gold).toBeNull();
    expect(w.stats.waves[0].livesLost).toBeGreaterThan(0);
  });

  it('[RM-06] produit le même registre de tours et le même décompte de vagues quand la partie est rejouée depuis le journal', () => {
    const a = newWorld('normal', 99);
    const archer = dispatch(a, { c: 'build', def: 'archer', x: 8, y: 3 }) as { ok: true; id: number };
    expect(archer.ok).toBe(true);
    const cannon = dispatch(a, { c: 'build', def: 'cannon', x: 12, y: 3 }) as { ok: true; id: number };
    expect(cannon.ok).toBe(true);
    run(a, 3);
    dispatch(a, { c: 'callWave' });
    run(a, 60);
    expect(dispatch(a, { c: 'upgrade', tower: cannon.id, def: 'mortar' }).ok).toBe(true);
    expect(dispatch(a, { c: 'sell', tower: archer.id }).ok).toBe(true);
    dispatch(a, { c: 'callWave' });
    run(a, 400);

    const toRegistry = (w: World) =>
      [...w.stats.towers.entries()]
        .sort(([idA], [idB]) => idA - idB)
        .map(([id, t]) => ({ id, fate: t.fate, name: t.def.name, damage: Math.round(t.damage), kills: t.kills, spent: t.spent }));

    const aRegistry = toRegistry(a);
    const aWaves = a.stats.waves;
    expect(aRegistry.length).toBeGreaterThan(0);
    expect(aRegistry.some((t) => t.fate === 'sold')).toBe(true);
    expect(aRegistry.some((t) => t.damage > 0)).toBe(true);
    expect(aWaves.length).toBeGreaterThan(0);
    expect(aWaves.some((w) => w.livesLost > 0)).toBe(true);
    expect(aWaves.some((w) => w.gold !== null)).toBe(true);

    const b = newWorld('normal', 99);
    const log = [...a.log];
    while (b.tick < a.tick) {
      while (log.length && log[0].tick === b.tick) dispatch(b, log.shift()!.cmd);
      b.step();
    }

    expect(toRegistry(b)).toEqual(aRegistry);
    expect(b.stats.waves).toEqual(aWaves);
  });

  it('[RM-04] ne compte pas plus de vies perdues que les vies restantes', () => {
    // Vies ne changent rien au déroulement (défaite mise à part) : on peut donc
    // chercher, sur une partie sans défaite, le premier tick où une fuite coûte
    // plus d'une vie, puis reproduire ce tick avec 1 seule vie restante.
    const probe = newWorld();
    probe.lives = 1_000_000;
    let before = probe.lives;
    let targetTick = -1;
    let leak = 0;
    for (let i = 0; i < 60 * 20000 && targetTick < 0; i++) {
      probe.step();
      const delta = before - probe.lives;
      if (delta > 1) {
        targetTick = probe.tick;
        leak = delta;
      }
      before = probe.lives;
    }
    expect(targetTick).toBeGreaterThan(0);
    expect(leak).toBeGreaterThan(1);

    const w = newWorld();
    w.lives = 1_000_000;
    while (w.tick < targetTick - 1) w.step();
    w.lives = 1;
    const totalBefore = w.stats.waves.reduce((sum, t) => sum + t.livesLost, 0);
    w.step();
    const totalAfter = w.stats.waves.reduce((sum, t) => sum + t.livesLost, 0);

    expect(totalAfter - totalBefore).toBe(1);
  });

  it('[RM-04] ne compte aucune vie perdue au-delà de la défaite quand plusieurs créatures s’échappent au même tick', () => {
    const w = newWorld();
    dispatch(w, { c: 'callWave' });
    for (let i = 0; i < 60 * 5 && w.creeps.length === 0; i++) w.step();
    // Place trois créatures pile sur la case de sortie : elles s'échappent
    // toutes au même tick, quelle que soit leur vitesse.
    const proto = w.creeps[0];
    const exitCell = w.grid.exitCells[0];
    proto.leg = 1;
    proto.tx = w.grid.cx(exitCell);
    proto.ty = w.grid.cy(exitCell);
    proto.x = proto.tx + 0.5;
    proto.y = proto.ty + 0.5;
    for (let k = 0; k < 2; k++) w.creeps.push({ ...proto, id: w.id(), alive: true });

    w.lives = 1;
    const leakedBefore = w.stats.leaked;
    const sum = () => w.stats.waves.reduce((s, t) => s + t.livesLost, 0);
    const totalBefore = sum();

    w.step();

    expect(w.stats.leaked - leakedBefore).toBeGreaterThanOrEqual(3);
    expect(sum() - totalBefore).toBe(1);
  });
});
