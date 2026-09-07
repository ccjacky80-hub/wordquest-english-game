import { getMvpEntries } from './loader';
import type { VocabularyEntry } from './schemas';

export interface DailyMissionPlan {
  dayIndex: number;
  newWordIds: string[];
  newWords: VocabularyEntry[];
  reviewWordIds: string[];
  assignmentSource: 'temporary-mvp-rank';
}

/**
 * Temporary Day 1 allocation: use MVP ranks 1-6 until official Day 1-Day 6
 * assignments are added to the master content source.
 */
export function createDay1Mission(): DailyMissionPlan {
  const newWords = getMvpEntries().slice(0, 6);
  return {
    dayIndex: 1,
    newWordIds: newWords.map((word) => word.id),
    newWords,
    reviewWordIds: [],
    assignmentSource: 'temporary-mvp-rank',
  };
}
