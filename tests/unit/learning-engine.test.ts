import { describe, expect, it } from 'vitest';
import { recordConfusion, recordConfusionResolution } from '@/domain/learning/confusion';
import { applyAttemptToProgress } from '@/domain/learning/mastery';
import { isReviewDue, scheduleReview } from '@/domain/learning/scheduler';
import { createEmptyWordProgress, type GameAttempt } from '@/domain/learning/types';

const baseAttempt = (overrides: Partial<GameAttempt> = {}): GameAttempt => ({
  id: 'a-1',
  sessionId: 's-1',
  gameType: 'picture-match',
  wordId: 'C0001',
  promptType: 'image-to-word',
  outcome: 'independentCorrect',
  attemptIndex: 1,
  hintsUsed: 0,
  audioReplayCount: 0,
  occurredAt: '2026-01-01T10:00:00.000Z',
  contentVersion: 1,
  ...overrides,
});

describe('mastery engine', () => {
  it('moves the first independent answer from New to Seen', () => {
    const next = applyAttemptToProgress(createEmptyWordProgress('C0001'), baseAttempt());
    expect(next.masteryLevel).toBe(1);
    expect(next.independentCorrectCount).toBe(1);
    expect(next.currentReviewStage).toBe(0);
    expect(next.nextReviewAt).toBe('2026-01-01T10:10:00.000Z');
  });

  it('records repeated wrong attempts without advancing mastery', () => {
    const initial = createEmptyWordProgress('C0001');
    const one = applyAttemptToProgress(initial, baseAttempt({ outcome: 'wrong' }));
    const two = applyAttemptToProgress(one, baseAttempt({ id: 'a-2', outcome: 'wrong', attemptIndex: 2 }));
    const three = applyAttemptToProgress(two, baseAttempt({ id: 'a-3', outcome: 'wrong', attemptIndex: 3 }));
    expect(three.masteryLevel).toBe(0);
    expect(three.wrongCount).toBe(3);
  });

  it('does not master after same-day correct answers', () => {
    let progress = createEmptyWordProgress('C0001');
    for (let i = 0; i < 3; i += 1) {
      progress = applyAttemptToProgress(
        progress,
        baseAttempt({ id: `a-${i}`, occurredAt: `2026-01-01T${10 + i}:00:00.000Z` }),
      );
    }
    expect(progress.masteryLevel).not.toBe(5);
  });

  it('requires a seven-day span and active recall evidence for Mastered', () => {
    let progress = createEmptyWordProgress('C0001');
    progress = applyAttemptToProgress(progress, baseAttempt({ id: 'a-1' }));
    progress = applyAttemptToProgress(
      progress,
      baseAttempt({ id: 'a-2', promptType: 'word-build', occurredAt: '2026-01-04T10:00:00.000Z' }),
    );
    progress = applyAttemptToProgress(
      progress,
      baseAttempt({ id: 'a-3', promptType: 'story-context', occurredAt: '2026-01-08T10:00:00.000Z' }),
    );
    expect(progress.masteryLevel).toBe(5);
    expect(progress.activeRecallCorrectCount).toBe(2);
  });

  it('keeps assisted correctness separate from independent correctness', () => {
    const next = applyAttemptToProgress(
      createEmptyWordProgress('C0001'),
      baseAttempt({ outcome: 'correctAfterHint' }),
    );
    expect(next.masteryLevel).toBe(0);
    expect(next.assistedCorrectCount).toBe(1);
  });
});

describe('review scheduler', () => {
  it('schedules a new word for ten minutes', () => {
    const review = scheduleReview({
      wordId: 'C0001',
      currentStage: 0,
      quality: 0,
      now: '2026-01-01T10:00:00.000Z',
      reason: 'new-word',
    });
    expect(review.dueAt).toBe('2026-01-01T10:10:00.000Z');
  });

  it('soft-retests a low-quality result after five minutes', () => {
    const review = scheduleReview({
      wordId: 'C0001',
      currentStage: 3,
      quality: 0,
      now: '2026-01-01T10:00:00.000Z',
    });
    expect(review.dueAt).toBe('2026-01-01T10:05:00.000Z');
    expect(isReviewDue(review.dueAt, '2026-01-01T10:05:00.000Z')).toBe(true);
  });

  it('advances a high-quality review to the next standard interval', () => {
    const review = scheduleReview({
      wordId: 'C0001',
      currentStage: 1,
      quality: 1,
      now: '2026-01-01T10:00:00.000Z',
    });
    expect(review.stage).toBe(2);
    expect(review.dueAt).toBe('2026-01-04T10:00:00.000Z');
  });
});

describe('confusion pairs', () => {
  it('creates a stable sorted key and increments count', () => {
    const first = recordConfusion(undefined, {
      wordId: 'C0002',
      selectedAnswerId: 'C0001',
      occurredAt: '2026-01-01T10:00:00.000Z',
    });
    const second = recordConfusion(first, {
      wordId: 'C0001',
      selectedAnswerId: 'C0002',
      occurredAt: '2026-01-02T10:00:00.000Z',
    });
    expect(second?.pairKey).toBe('C0001:C0002');
    expect(second?.count).toBe(2);
  });

  it('does not create a pair for a correct selection and tracks resolution', () => {
    const pair = recordConfusion(undefined, {
      wordId: 'C0001',
      selectedAnswerId: 'C0001',
      occurredAt: '2026-01-01T10:00:00.000Z',
    });
    expect(pair).toBeUndefined();
    const unresolved = recordConfusion(undefined, {
      wordId: 'C0001',
      selectedAnswerId: 'C0002',
      occurredAt: '2026-01-01T10:00:00.000Z',
    });
    expect(recordConfusionResolution(unresolved!, true).resolvedEvidenceCount).toBe(1);
  });
});
