import { describe, expect, it } from 'vitest';
import { WordQuestDB } from '@/db/db';

describe('WordQuestDB v1 schema', () => {
  it('declares all local-first learning tables', () => {
    const db = new WordQuestDB(`wordquest-test-${Date.now()}`);
    expect(db.tables.map((table) => table.name)).toEqual([
      'wordProgress',
      'attempts',
      'reviewQueue',
      'confusionPairs',
      'sessions',
      'rewards',
      'settings',
      'localEvents',
    ]);
    db.close();
  });
});
