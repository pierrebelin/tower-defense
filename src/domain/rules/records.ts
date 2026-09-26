import type { Difficulty } from '../model/types';

export type RecordBook = Record<string, Partial<Record<Difficulty, number>>>;

export function withRecord(
  book: RecordBook,
  mapId: string,
  difficulty: Difficulty,
  reached: number
): RecordBook {
  const previous = book[mapId]?.[difficulty];
  if (previous !== undefined && previous >= reached) {
    return book;
  }
  return {
    ...book,
    [mapId]: { ...book[mapId], [difficulty]: reached },
  };
}

export function importLegacyRecords(
  book: RecordBook,
  legacy: Partial<Record<Difficulty, number>>,
  mapId: string
): RecordBook {
  return (Object.keys(legacy) as Difficulty[]).reduce(
    (acc, difficulty) => withRecord(acc, mapId, difficulty, legacy[difficulty]!),
    book
  );
}
