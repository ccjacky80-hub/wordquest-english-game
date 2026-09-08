import { isReviewDue } from '@/domain/learning/scheduler';
import type { ReviewQueueEntry, WordProgress } from '@/domain/learning/types';
import type { DailyMissionPlan } from './daily-plan';

export function getDueReviewWordIds(
  mission: Pick<DailyMissionPlan, 'reviewWordIds'>,
  progress: readonly WordProgress[],
  now: string,
): string[] {
  const progressById = new Map(progress.map((entry) => [entry.wordId, entry]));
  return mission.reviewWordIds.filter((wordId) => {
    const entry = progressById.get(wordId);
    return entry?.nextReviewAt !== undefined && isReviewDue(entry.nextReviewAt, now);
  });
}

export function getDueReviewEntries(entries: readonly ReviewQueueEntry[], now: string): ReviewQueueEntry[] {
  return entries.filter((entry) => isReviewDue(entry.dueAt, now)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}
