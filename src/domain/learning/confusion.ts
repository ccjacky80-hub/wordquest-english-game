import type { ConfusionPair, GameAttempt } from './types';

export function confusionPairKey(wordAId: string, wordBId: string): string {
  return [wordAId, wordBId].sort().join(':');
}

export function recordConfusion(
  existing: ConfusionPair | undefined,
  attempt: Pick<GameAttempt, 'wordId' | 'selectedAnswerId' | 'occurredAt'>,
): ConfusionPair | undefined {
  const selected = attempt.selectedAnswerId;
  if (!selected || selected === attempt.wordId) return existing;

  const [wordAId, wordBId] = [attempt.wordId, selected].sort();
  return {
    pairKey: confusionPairKey(wordAId, wordBId),
    wordAId,
    wordBId,
    count: (existing?.count ?? 0) + 1,
    lastOccurredAt: attempt.occurredAt,
    resolvedEvidenceCount: existing?.resolvedEvidenceCount ?? 0,
  };
}

export function recordConfusionResolution(
  pair: ConfusionPair,
  independentCorrect: boolean,
): ConfusionPair {
  return independentCorrect
    ? { ...pair, resolvedEvidenceCount: pair.resolvedEvidenceCount + 1 }
    : pair;
}
