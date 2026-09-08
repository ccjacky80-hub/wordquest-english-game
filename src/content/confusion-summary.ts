import { recordConfusion } from '@/domain/learning/confusion';
import type { ConfusionPair, GameAttempt } from '@/domain/learning/types';

export function aggregateConfusionPairs(attempts: readonly GameAttempt[]): ConfusionPair[] {
  const pairs = new Map<string, ConfusionPair>();
  for (const attempt of attempts) {
    if (!attempt.confusionWithWordId || attempt.outcome === 'independentCorrect' || attempt.outcome === 'correctAfterReplay' || attempt.outcome === 'correctAfterHint') continue;
    const [wordAId, wordBId] = [attempt.wordId, attempt.confusionWithWordId].sort();
    const key = `${wordAId}:${wordBId}`;
    const next = recordConfusion(pairs.get(key), { wordId: attempt.wordId, selectedAnswerId: attempt.confusionWithWordId, occurredAt: attempt.occurredAt });
    if (next) pairs.set(key, next);
  }
  return [...pairs.values()].sort((a, b) => b.count - a.count || b.lastOccurredAt.localeCompare(a.lastOccurredAt));
}
