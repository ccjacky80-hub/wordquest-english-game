import type { AttemptOutcome } from './types';

export type AttemptProtectionStage = 'fresh' | 'replay' | 'hint' | 'revealed' | 'soft-retest';

export interface AttemptProtectionState {
  failedAttempts: number;
  stage: AttemptProtectionStage;
  maxAttempts: 3;
  answerRevealed: boolean;
  softRetestDelayMs: number;
}

export function getAttemptProtectionState(failedAttempts: number): AttemptProtectionState {
  const failures = Math.max(0, failedAttempts);
  if (failures >= 3) return { failedAttempts: failures, stage: 'soft-retest', maxAttempts: 3, answerRevealed: true, softRetestDelayMs: 5 * 60_000 };
  if (failures === 2) return { failedAttempts: failures, stage: 'hint', maxAttempts: 3, answerRevealed: false, softRetestDelayMs: 0 };
  if (failures === 1) return { failedAttempts: failures, stage: 'replay', maxAttempts: 3, answerRevealed: false, softRetestDelayMs: 0 };
  return { failedAttempts: 0, stage: 'fresh', maxAttempts: 3, answerRevealed: false, softRetestDelayMs: 0 };
}

export function outcomeAfterProtectedCorrect(failedAttempts: number): Exclude<AttemptOutcome, 'wrong'> {
  if (failedAttempts >= 3) return 'revealed';
  if (failedAttempts === 2) return 'correctAfterHint';
  if (failedAttempts === 1) return 'correctAfterReplay';
  return 'independentCorrect';
}

export function shouldEnterSoftRetest(failedAttempts: number): boolean { return failedAttempts >= 3; }
