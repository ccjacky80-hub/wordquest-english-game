import { describe, expect, it } from 'vitest';
import { getAttemptProtectionState, outcomeAfterProtectedCorrect, shouldEnterSoftRetest } from '@/domain/learning/attempt-protection';

describe('three-attempt protection', () => {
  it('escalates fresh -> hint -> revealed -> soft retest', () => {
    expect(getAttemptProtectionState(0).stage).toBe('fresh');
    expect(getAttemptProtectionState(1).stage).toBe('replay');
    expect(getAttemptProtectionState(2).stage).toBe('hint');
    expect(getAttemptProtectionState(3).stage).toBe('soft-retest');
  });

  it('maps a protected correct answer to the defined outcome', () => {
    expect(outcomeAfterProtectedCorrect(0)).toBe('independentCorrect');
    expect(outcomeAfterProtectedCorrect(1)).toBe('correctAfterReplay');
    expect(outcomeAfterProtectedCorrect(2)).toBe('correctAfterHint');
    expect(outcomeAfterProtectedCorrect(3)).toBe('revealed');
  });

  it('enters a five-minute soft retest after the third failed attempt', () => {
    expect(shouldEnterSoftRetest(2)).toBe(false);
    expect(shouldEnterSoftRetest(3)).toBe(true);
    expect(getAttemptProtectionState(3).softRetestDelayMs).toBe(300000);
  });
});
