import { isIndependentCorrect, qualityForAttempt } from './quality';
import { scheduleReview } from './scheduler';
import type { GameAttempt, MasteryLevel, WordProgress } from './types';

const MAX_MASTERY: MasteryLevel = 5;

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function hasActiveRecallEvidence(attempt: GameAttempt): boolean {
  return (
    isIndependentCorrect(attempt.outcome) &&
    (attempt.promptType === 'word-build' || attempt.promptType === 'story-context')
  );
}

function nextEvidenceLevel(progress: WordProgress, attempt: GameAttempt): MasteryLevel {
  if (!isIndependentCorrect(attempt.outcome)) {
    return progress.masteryLevel;
  }

  if (attempt.promptType === 'story-context') {
    return Math.max(progress.masteryLevel, 4) as MasteryLevel;
  }

  if (attempt.promptType === 'word-build') {
    return Math.max(progress.masteryLevel, 3) as MasteryLevel;
  }

  if (progress.masteryLevel === 0) return 1;
  if (progress.masteryLevel === 1) return 2;
  if (progress.masteryLevel === 2) return 3;
  return progress.masteryLevel;
}

function canMaster(progress: WordProgress, attempt: GameAttempt, nextLevel: MasteryLevel): boolean {
  const attemptDate = dateKey(attempt.occurredAt);
  const dates = new Set([...progress.independentCorrectDates, attemptDate]);
  const firstDate = progress.firstSeenAt ? dateKey(progress.firstSeenAt) : attemptDate;
  const spanDays = Math.floor(
    (Date.parse(`${attemptDate}T00:00:00Z`) - Date.parse(`${firstDate}T00:00:00Z`)) /
      86_400_000,
  );

  return (
    nextLevel >= 4 &&
    dates.size >= 2 &&
    spanDays >= 7 &&
    progress.independentCorrectCount + (isIndependentCorrect(attempt.outcome) ? 1 : 0) >= 3 &&
    (progress.activeRecallCorrectCount + (hasActiveRecallEvidence(attempt) ? 1 : 0) >= 1) &&
    qualityForAttempt(attempt) >= 0.8
  );
}

export function applyAttemptToProgress(
  progress: WordProgress,
  attempt: GameAttempt,
): WordProgress {
  const quality = qualityForAttempt(attempt);
  const independent = isIndependentCorrect(attempt.outcome);
  const activeRecall = hasActiveRecallEvidence(attempt);
  const nextLevel = nextEvidenceLevel(progress, attempt);
  const independentDates = independent
    ? [...new Set([...progress.independentCorrectDates, dateKey(attempt.occurredAt)])]
    : progress.independentCorrectDates;
  const masteryLevel = canMaster(progress, attempt, nextLevel) ? MAX_MASTERY : nextLevel;
  const review = scheduleReview({
    wordId: attempt.wordId,
    currentStage: progress.currentReviewStage,
    quality,
    now: attempt.occurredAt,
    reason: progress.attemptCount === 0 ? 'new-word' : undefined,
  });

  return {
    ...progress,
    masteryLevel,
    firstSeenAt: progress.firstSeenAt ?? attempt.occurredAt,
    lastSeenAt: attempt.occurredAt,
    lastIndependentCorrectAt: independent ? attempt.occurredAt : progress.lastIndependentCorrectAt,
    independentCorrectCount: progress.independentCorrectCount + (independent ? 1 : 0),
    assistedCorrectCount:
      progress.assistedCorrectCount + (!independent && attempt.outcome !== 'wrong' ? 1 : 0),
    wrongCount: progress.wrongCount + (attempt.outcome === 'wrong' ? 1 : 0),
    activeRecallCorrectCount: progress.activeRecallCorrectCount + (activeRecall ? 1 : 0),
    independentCorrectDates: independentDates,
    attemptCount: progress.attemptCount + 1,
    lastQuality: quality,
    activeRecall: Math.max(progress.activeRecall, activeRecall ? quality : 0),
    spelling: Math.max(
      progress.spelling,
      independent && attempt.promptType === 'word-build' ? quality : 0,
    ),
    contextUse: Math.max(
      progress.contextUse,
      independent && attempt.promptType === 'story-context' ? quality : 0,
    ),
    memoryStrength: Math.max(progress.memoryStrength, quality),
    currentReviewStage: review.stage,
    nextReviewAt: review.dueAt,
    version: progress.version + 1,
  };
}
