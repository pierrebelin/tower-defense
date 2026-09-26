import { describe, expect, it } from 'vitest';
import { TOWERS } from '../../../src/domain/catalog/towers';
import { TOWER_ART } from '../../../src/infrastructure/render/sprites';
import { CREEPS } from '../../../src/domain/catalog/creeps';
import { CREEP_STYLE } from '../../../src/infrastructure/render/palette';

describe('dessins des tours', () => {
  it('donne à chaque tour du catalogue un dessin qui lui est propre', () => {
    for (const id of Object.keys(TOWERS)) expect(TOWER_ART[id], id).toBeTypeOf('function');
    expect(new Set(Object.values(TOWER_ART)).size).toBe(Object.keys(TOWER_ART).length);
  });
});

describe('styles des créatures', () => {
  it('donne un style à chaque créature du catalogue', () => {
    for (const id of Object.keys(CREEPS)) expect(CREEP_STYLE[id], id).toBeDefined();
  });
});
