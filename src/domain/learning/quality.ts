import type { AttemptOutcome, GameAttempt } from './types';

const QUALITY_BY_OUTCOME: Record<AttemptOutcome, number> = {
  independentCorrect: 1,
  correctAfterReplay: 0.65,
  correctAfterHint: 0.4,
  revealed: 0.15,
  wrong: 0,
};

export function qualityForOutcome(outcome: AttemptOutcome): number {
  return QUALITY_BY_OUTCOME[outcome];
}

export function qualityForAttempt(attempt: Pick<GameAttempt, 'outcome'>): number {
  return qualityForOutcome(attempt.outcome);
}

export function isIndependentCorrect(outcome: AttemptOutcome): boolean {
  return outcome === 'independentCorrect';
}
