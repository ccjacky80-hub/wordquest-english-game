import { describe, expect, it } from 'vitest';
import { qualityForOutcome } from '@/domain/learning/quality';

describe('qualityForOutcome', () => {
  it('keeps independent recall above assisted outcomes', () => {
    expect(qualityForOutcome('independentCorrect')).toBe(1);
    expect(qualityForOutcome('correctAfterHint')).toBe(0.4);
  });
});
