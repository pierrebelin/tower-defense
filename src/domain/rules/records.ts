import type { Difficulty } from '../model/types';

export type RecordBook = Record<string, Partial<Record<Difficulty, number>>>;

export function withRecord(book: RecordBook, mapId: string, difficulty: Difficulty, reached: number): RecordBook {
  const best = book[mapId]?.[difficulty];
  if (best !== undefined && best >= reached) return book;

  return { ...book, [mapId]: { ...book[mapId], [difficulty]: reached } };
}

export function importLegacyRecords(
  book: RecordBook,
  legacy: Partial<Record<Difficulty, number>>,
  mapId: string
): RecordBook {
  return (Object.entries(legacy) as [Difficulty, number][]).reduce(
    (acc, [difficulty, reached]) => withRecord(acc, mapId, difficulty, reached),
    book
  );
}
