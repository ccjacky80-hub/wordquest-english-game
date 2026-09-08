import { describe, expect, it } from 'vitest';
import { createBossSteps, getBossProgress } from '@/content/boss-mission';
import type { GameAttempt } from '@/domain/learning/types';

const attempt = (day: number, wordId: string): GameAttempt => ({
  id: `${day}-${wordId}`, sessionId: `day${day}-picture-match`, gameType: 'picture-match', wordId,
  promptType: 'image-to-word', outcome: 'independentCorrect', attemptIndex: 1, hintsUsed: 0,
  audioReplayCount: 0, occurredAt: '2026-09-08T10:00:00.000Z', contentVersion: 1,
});

describe('boss mission unlock', () => {
  it('stays locked before six words are learned', () => {
    const progress = getBossProgress([attempt(1, 'C0430')]);
    expect(progress.unlocked).toBe(false);
    expect(createBossSteps([attempt(1, 'C0430')])).toBeUndefined();
  });

  it('unlocks from six learned words and creates three story steps', () => {
    const attempts = [
      ...['C0430', 'C0431', 'C0432', 'C0402', 'C0433', 'C0434'].map((id) => attempt(1, id)),
      ...['C0435', 'C0436', 'C0437', 'C0438', 'C0439'].map((id) => attempt(2, id)),
      ...['C0440', 'C0441', 'C0442', 'C0403', 'C0399'].map((id) => attempt(3, id)),
    ];
    const progress = getBossProgress(attempts);
    expect(progress.unlocked).toBe(true);
    expect(createBossSteps(attempts)).toHaveLength(3);
  });
});
