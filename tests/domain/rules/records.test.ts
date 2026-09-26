import { describe, expect, it } from 'vitest';
import { withRecord, importLegacyRecords, type RecordBook } from '../../../src/domain/rules/records';

describe('records', () => {
  it('[RM-06] garde le meilleur résultat séparément pour chaque carte et difficulté', () => {
    const book: RecordBook = {};
    const b1 = withRecord(book, 'foret', 'normal', 5);
    const b2 = withRecord(b1, 'foret', 'hard', 3);
    const b3 = withRecord(b2, 'desert', 'normal', 7);

    expect(b3).toEqual({
      foret: { normal: 5, hard: 3 },
      desert: { normal: 7 },
    });
  });

  it('[RM-06] ne remplace pas un record par un résultat moins bon', () => {
    const book: RecordBook = { foret: { normal: 8 } };

    const r = withRecord(book, 'foret', 'normal', 4);

    expect(r).toEqual({ foret: { normal: 8 } });
    expect(book).toEqual({ foret: { normal: 8 } });
  });

  it('[RM-06] attribue les records existants au Gué des Runes quand on les importe', () => {
    const book: RecordBook = { desert: { normal: 2 } };
    const legacy = { normal: 5, hard: 3 };

    const r = importLegacyRecords(book, legacy, 'crossing');

    expect(r).toEqual({
      desert: { normal: 2 },
      crossing: { normal: 5, hard: 3 },
    });
  });

  it('[RM-06] garde le plus haut quand un ancien et un nouveau record existent pour la même difficulté', () => {
    const bookAncienPlusHaut: RecordBook = { crossing: { normal: 9 } };
    const rAncienPlusHaut = importLegacyRecords(bookAncienPlusHaut, { normal: 4 }, 'crossing');
    expect(rAncienPlusHaut).toEqual({ crossing: { normal: 9 } });

    const bookNouveauPlusHaut: RecordBook = { crossing: { normal: 2 } };
    const rNouveauPlusHaut = importLegacyRecords(bookNouveauPlusHaut, { normal: 7 }, 'crossing');
    expect(rNouveauPlusHaut).toEqual({ crossing: { normal: 7 } });
  });
});
