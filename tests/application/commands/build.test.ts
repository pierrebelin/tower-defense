import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { newWorld } from '../../support/helpers';
import { MAP_POCKETS } from '../../support/maps';

describe('build', () => {
  it('[RM-03] refuse la construction quand elle fermerait le tronçon de la pierre 2 à la porte', () => {
    const w = newWorld('normal', 42, MAP_POCKETS);
    const towers = w.towers.length;

    const r = dispatch(w, { c: 'build', def: 'wall', x: 10, y: 9 });

    expect(r.ok).toBe(false);
    expect(w.towers.length).toBe(towers);
    expect(Number.isFinite(w.mazeLength())).toBe(true);
  });

  it('[RM-03] accepte la construction quand tous les tronçons restent ouverts', () => {
    const w = newWorld('normal', 42, MAP_POCKETS);

    const r = dispatch(w, { c: 'build', def: 'wall', x: 6, y: 6 });

    expect(r.ok).toBe(true);
  });

  it('allonge le trajet quand on construit un mur en travers', () => {
    const w = newWorld();
    const before = w.mazeLength();
    // Un rideau de murs vertical de y=1 à y=20, colonne 10 : les créatures doivent contourner par le bas.
    for (let y = 1; y <= 19; y += 2) expect(dispatch(w, { c: 'build', def: 'wall', x: 10, y }).ok).toBe(true);
    expect(w.mazeLength()).toBeGreaterThan(before + 10);
  });

  it('refuse toute construction qui fermerait le passage', () => {
    const w = newWorld('easy');
    w.gold = 10_000;
    // Mur complet sur la colonne 20 sauf la dernière case : le dernier bloc doit être refusé.
    const results = [];
    for (let y = 1; y <= 21; y += 2) results.push(dispatch(w, { c: 'build', def: 'wall', x: 20, y }));
    const last = results[results.length - 1];
    expect(last.ok).toBe(false);
    expect(Number.isFinite(w.mazeLength())).toBe(true);
  });
});
