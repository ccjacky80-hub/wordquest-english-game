import type { ReviewReason, ReviewSchedule } from './types';

export const REVIEW_INTERVALS_MS = [
  10 * 60_000,
  1 * 86_400_000,
  3 * 86_400_000,
  7 * 86_400_000,
  14 * 86_400_000,
  30 * 86_400_000,
] as const;

const SOFT_RETEST_MS = 5 * 60_000;

export interface ReviewInput {
  wordId: string;
  currentStage: number;
  quality: number;
  now: string;
  reason?: ReviewReason;
}

function clampStage(stage: number): number {
  return Math.max(0, Math.min(stage, REVIEW_INTERVALS_MS.length - 1));
}

export function nextReviewStage(currentStage: number, quality: number): number {
  const stage = clampStage(currentStage);
  if (quality >= 0.8) return Math.min(stage + 1, REVIEW_INTERVALS_MS.length - 1);
  if (quality >= 0.4) return stage;
  return Math.max(0, stage - 1);
}

export function reviewDelayMs(currentStage: number, quality: number): number {
  if (quality < 0.4) return SOFT_RETEST_MS;
  const stage = nextReviewStage(currentStage, quality);
  if (quality < 0.8) return Math.max(SOFT_RETEST_MS, Math.floor(REVIEW_INTERVALS_MS[stage] / 2));
  return REVIEW_INTERVALS_MS[stage];
}

export function scheduleReview(input: ReviewInput): ReviewSchedule {
  const reason = input.reason ?? (input.quality < 0.4 ? 'low-quality' : 'standard-review');
  const isNewWord = reason === 'new-word';
  const stage = isNewWord ? 0 : nextReviewStage(input.currentStage, input.quality);
  const delay = isNewWord
    ? REVIEW_INTERVALS_MS[0]
    : reviewDelayMs(input.currentStage, input.quality);
  const dueAt = new Date(Date.parse(input.now) + delay).toISOString();
  return {
    wordId: input.wordId,
    stage,
    dueAt,
    lastQuality: input.quality,
    reason,
  };
}

export function isReviewDue(dueAt: string, now: string): boolean {
  return Date.parse(dueAt) <= Date.parse(now);
}
