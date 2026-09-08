import type { GameAttempt, MasteryLevel, WordProgress } from '@/domain/learning/types';
import { isReviewDue } from '@/domain/learning/scheduler';

export type ParentVocabularyGroup = 'New' | 'Learning' | 'Review Due' | 'Strong' | 'Mastered';

export interface ProblemWord {
  wordId: string;
  consecutiveWrong: number;
  reason: 'consecutive-wrong' | 'declining-7d';
  lastOccurredAt: string;
}

export function parentVocabularyGroup(progress: WordProgress, now: string): ParentVocabularyGroup {
  if (progress.masteryLevel === 5) return 'Mastered';
  if (progress.nextReviewAt && isReviewDue(progress.nextReviewAt, now)) return 'Review Due';
  if (progress.masteryLevel === 0 && progress.attemptCount === 0) return 'New';
  if (progress.masteryLevel >= 4 && progress.lastQuality >= 0.8) return 'Strong';
  return 'Learning';
}

function recentAttemptsForWord(attempts: readonly GameAttempt[], wordId: string, cutoff: number): GameAttempt[] {
  return attempts.filter((attempt) => attempt.wordId === wordId && Date.parse(attempt.occurredAt) >= cutoff).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export function getProblemWords(progress: readonly WordProgress[], attempts: readonly GameAttempt[], now: string): ProblemWord[] {
  const cutoff = Date.parse(now) - 7 * 86_400_000;
  const result: ProblemWord[] = [];
  for (const entry of progress) {
    const recent = recentAttemptsForWord(attempts, entry.wordId, cutoff);
    let consecutiveWrong = 0;
    for (const attempt of recent) {
      if (attempt.outcome === 'wrong' || attempt.outcome === 'revealed') consecutiveWrong += 1;
      else break;
    }
    if (consecutiveWrong >= 2) {
      result.push({ wordId: entry.wordId, consecutiveWrong, reason: 'consecutive-wrong', lastOccurredAt: recent[0].occurredAt });
      continue;
    }
    const qualities = recent.map((attempt) => attempt.outcome === 'wrong' || attempt.outcome === 'revealed' ? 0 : attempt.outcome === 'correctAfterHint' || attempt.outcome === 'correctAfterReplay' ? 0.5 : 1);
    if (qualities.length >= 3 && qualities[0] < qualities[qualities.length - 1]) result.push({ wordId: entry.wordId, consecutiveWrong, reason: 'declining-7d', lastOccurredAt: recent[0].occurredAt });
  }
  return result.sort((a, b) => b.consecutiveWrong - a.consecutiveWrong || b.lastOccurredAt.localeCompare(a.lastOccurredAt));
}

export function groupVocabulary(progress: readonly WordProgress[], now: string): Record<ParentVocabularyGroup, WordProgress[]> {
  const groups: Record<ParentVocabularyGroup, WordProgress[]> = { New: [], Learning: [], 'Review Due': [], Strong: [], Mastered: [] };
  for (const entry of progress) groups[parentVocabularyGroup(entry, now)].push(entry);
  return groups;
}
