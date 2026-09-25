import { describe, expect, it } from 'vitest';
import { dispatch } from '../../../src/application/dispatch';
import { previewRoute } from '../../../src/application/queries/previewRoute';
import { newWorld } from '../../support/helpers';
import { MAP_TWO_STONES } from '../../support/maps';

describe('previewRoute', () => {
  it('[RM-04] renvoie trois tronçons enchaînés du portail à la porte quand la carte a deux pierres', () => {
    const w = newWorld('normal', 42, MAP_TWO_STONES);
    const x = 6;
    const y = 11;

    const { route } = previewRoute(w, x, y);

    expect(route).toHaveLength(3);
    for (let k = 1; k < route.length; k++) {
      expect(route[k][0]).toBe(route[k - 1][route[k - 1].length - 1]);
    }

    const w2 = newWorld('normal', 42, MAP_TWO_STONES);
    expect(dispatch(w2, { c: 'build', def: 'wall', x, y }).ok).toBe(true);
    expect(route).toEqual(w2.groundRoute());
  });

  it('[RM-04] donne la longueur du trajet complet avec le mur prévisualisé', () => {
    const w = newWorld('normal', 42, MAP_TWO_STONES);
    // (6, 7) : rallonge réellement le trajet pierre 2 → porte, contrairement à (6, 11).
    const x = 6;
    const y = 7;
    const lengthBefore = w.mazeLength();

    const { length } = previewRoute(w, x, y);

    const w2 = newWorld('normal', 42, MAP_TWO_STONES);
    dispatch(w2, { c: 'build', def: 'wall', x, y });
    expect(length).toBe(w2.mazeLength());
    expect(length).not.toBe(lengthBefore);
  });

  it('laisse le labyrinthe inchangé après l’aperçu', () => {
    const w = newWorld('normal', 42, MAP_TWO_STONES);
    const lengthBefore = w.mazeLength();
    const routeBefore = w.groundRoute();

    previewRoute(w, 6, 11);

    expect(w.mazeLength()).toBe(lengthBefore);
    expect(w.groundRoute()).toEqual(routeBefore);
  });
});
