import { describe, expect, it } from 'vitest';
import { getDueReviewEntries, getDueReviewWordIds } from '@/content/review-queue';
import { createDailyMission } from '@/content/daily-plan';
import type { ReviewQueueEntry, WordProgress } from '@/domain/learning/types';

describe('dynamic review queue', () => {
  it('returns only daily-plan review words whose nextReviewAt is due', () => {
    const mission = createDailyMission(2);
    const progress = [
      { wordId: mission.reviewWordIds[0], nextReviewAt: '2026-01-01T09:00:00.000Z' },
      { wordId: mission.reviewWordIds[1], nextReviewAt: '2026-01-01T12:00:00.000Z' },
    ] as WordProgress[];
    expect(getDueReviewWordIds(mission, progress, '2026-01-01T10:00:00.000Z')).toEqual([mission.reviewWordIds[0]]);
  });

  it('sorts due queue entries by earliest due time', () => {
    const entries = [
      { wordId: 'b', stage: 1, dueAt: '2026-01-01T09:00:00.000Z', lastQuality: 1, reason: 'standard-review' },
      { wordId: 'a', stage: 1, dueAt: '2026-01-01T08:00:00.000Z', lastQuality: 1, reason: 'standard-review' },
    ] as ReviewQueueEntry[];
    expect(getDueReviewEntries(entries, '2026-01-01T10:00:00.000Z').map((entry) => entry.wordId)).toEqual(['a', 'b']);
  });
});
