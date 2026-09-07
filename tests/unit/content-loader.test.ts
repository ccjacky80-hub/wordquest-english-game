import { describe, expect, it } from 'vitest';
import { createDay1Mission } from '@/content/daily-plan';
import { getMvpEntries, getVocabularyEntries, getVocabularyEntry } from '@/content/loader';

describe('vocabulary content loader', () => {
  it('loads all 471 entries from the validated static bundle', () => {
    expect(getVocabularyEntries()).toHaveLength(471);
  });

  it('filters Animal Kingdom MVP entries and preserves rank order', () => {
    const entries = getVocabularyEntries({ world: 'Animal Kingdom', mvpOnly: true });
    expect(entries).toHaveLength(30);
    expect(getMvpEntries().slice(0, 3).map((entry) => entry.mvp?.rank)).toEqual([1, 2, 3]);
    expect(getVocabularyEntry(entries[0].id)?.id).toBe(entries[0].id);
  });

  it('supports rank and rank range queries', () => {
    expect(getVocabularyEntries({ mvpRank: 1 })).toHaveLength(1);
    expect(getVocabularyEntries({ mvpRankRange: { min: 1, max: 6 } })).toHaveLength(6);
  });
});

describe('Day 1 temporary mission allocation', () => {
  it('uses MVP ranks 1-6 and records the temporary source', () => {
    const mission = createDay1Mission();
    expect(mission.dayIndex).toBe(1);
    expect(mission.newWordIds).toHaveLength(6);
    expect(mission.newWords.map((word) => word.mvp?.rank)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(mission.assignmentSource).toBe('temporary-mvp-rank');
  });
});
