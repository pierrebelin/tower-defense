import type { MapDef } from '../../src/domain/model/types';

// Couloir horizontal d'une case de haut, entouré de rochers. Ordre de gauche
// à droite : E, S, 2, 1 — la pierre 2 est donc sur le chemin du portail à la
// pierre 1, avant que la créature ne l'ait atteinte.
export const MAP_CORRIDOR: MapDef = {
  id: 'corridor',
  name: 'Le Couloir Double',
  width: 14,
  height: 3,
  rows: [
    '##############',
    '#E..S..2..1..#',
    '##############',
  ],
};

// Champ ouvert, rochers en bordure seulement. S, 1, 2, E dans des coins
// distincts, reliés par du terrain constructible (goulets de largeur 2 cases
// possibles n'importe où sur le champ ouvert).
// Portail et pierre 1 en champ ouvert. Pierre 2 et porte E dans deux poches
// de rochers, chacune accessible seulement par un goulet de 2 cases de large
// (colonnes 3-4 pour la poche « 2 », colonnes 10-11 pour la poche « E »).
export const MAP_POCKETS: MapDef = {
  id: 'pockets',
  name: 'Les Poches',
  width: 15,
  height: 15,
  rows: [
    '###############',
    '#SSS.......111#',
    '#SSS.......111#',
    '#SSS.......111#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '###..#####..###',
    '#222222#EEEEEE#',
    '#222222#EEEEEE#',
    '#222222#EEEEEE#',
    '###############',
  ],
};

export const MAP_TWO_STONES: MapDef = {
  id: 'two-stones',
  name: 'La Plaine aux Deux Pierres',
  width: 15,
  height: 15,
  rows: [
    '###############',
    '#SSS.......111#',
    '#SSS.......111#',
    '#SSS.......111#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#222.......EEE#',
    '#222.......EEE#',
    '#222.......EEE#',
    '###############',
  ],
};
