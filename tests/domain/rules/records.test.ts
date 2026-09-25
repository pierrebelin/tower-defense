import { describe, expect, it } from 'vitest';
import { importLegacyRecords, withRecord } from '../../../src/domain/rules/records';

describe('records', () => {
  it('[RM-06] garde le meilleur résultat séparément pour chaque carte et difficulté', () => {
    let book = withRecord({}, 'crossing', 'easy', 5);
    book = withRecord(book, 'crossing', 'hard', 3);
    book = withRecord(book, 'spiral', 'easy', 7);

    expect(book).toEqual({
      crossing: { easy: 5, hard: 3 },
      spiral: { easy: 7 },
    });
  });

  it('[RM-06] ne remplace pas un record par un résultat moins bon', () => {
    const book = withRecord({ crossing: { normal: 10 } }, 'crossing', 'normal', 4);

    expect(book).toEqual({ crossing: { normal: 10 } });
  });

  it('[RM-06] attribue les records existants au Gué des Runes quand on les importe', () => {
    const book = importLegacyRecords({ spiral: { easy: 9 } }, { easy: 5, hard: 3 }, 'crossing');

    expect(book).toEqual({
      spiral: { easy: 9 },
      crossing: { easy: 5, hard: 3 },
    });
  });

  it('[RM-06] garde le plus haut quand un ancien et un nouveau record existent pour la même difficulté', () => {
    const book = importLegacyRecords(
      { crossing: { easy: 10, hard: 2 } },
      { easy: 4, hard: 8 },
      'crossing'
    );

    expect(book).toEqual({ crossing: { easy: 10, hard: 8 } });
  });
});
