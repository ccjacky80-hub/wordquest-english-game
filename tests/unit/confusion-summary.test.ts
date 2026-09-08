import { describe, expect, it } from 'vitest';
import { aggregateConfusionPairs } from '@/content/confusion-summary';
import type { GameAttempt } from '@/domain/learning/types';

const attempt = (id: string, wordId: string, confusionWithWordId: string, outcome: GameAttempt['outcome'] = 'wrong'): GameAttempt => ({ id, sessionId: 's', gameType: 'picture-match', wordId, confusionWithWordId, selectedAnswerId: confusionWithWordId, promptType: 'image-to-word', outcome, attemptIndex: 1, hintsUsed: 0, audioReplayCount: 0, occurredAt: `2026-09-08T10:0${id.length}:00.000Z`, contentVersion: 1 });

describe('confusion pair aggregation', () => {
  it('counts repeated A-to-B wrong selections using a stable pair key', () => {
    const pairs = aggregateConfusionPairs([attempt('a', 'A', 'B'), attempt('b', 'A', 'B'), attempt('c', 'B', 'A')]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ pairKey: 'A:B', wordAId: 'A', wordBId: 'B', count: 3 });
  });

  it('does not count correct attempts, while revealed mistakes remain evidence', () => {
    expect(aggregateConfusionPairs([attempt('a', 'A', 'B', 'independentCorrect')])).toEqual([]);
    expect(aggregateConfusionPairs([attempt('b', 'A', 'B', 'revealed')])[0].count).toBe(1);
  });
});
