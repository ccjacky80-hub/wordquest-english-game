import type { ConfusionPair, GameAttempt, WordProgress } from '@/domain/learning/types';
import { recordConfusion } from '@/domain/learning/confusion';
import { applyAttemptToProgress } from '@/domain/learning/mastery';
import { createEmptyWordProgress } from '@/domain/learning/types';
import { wordQuestDb, type WordQuestDB } from '../db';

export interface ProgressRepository {
  getWordProgress(wordId: string): Promise<WordProgress | undefined>;
  getAttemptsBySession(sessionId: string): Promise<GameAttempt[]>;
  getAllAttempts(): Promise<GameAttempt[]>;
  getAllWordProgress(): Promise<WordProgress[]>;
  getAllReviewQueue(): Promise<import('@/domain/learning/types').ReviewQueueEntry[]>;
  getAllConfusionPairs(): Promise<ConfusionPair[]>;
  recordAttempt(attempt: GameAttempt): Promise<WordProgress>;
}

export function createProgressRepository(db: WordQuestDB = wordQuestDb): ProgressRepository {
  return {
    async getWordProgress(wordId: string): Promise<WordProgress | undefined> {
      return db.wordProgress.get(wordId);
    },
    async getAttemptsBySession(sessionId: string): Promise<GameAttempt[]> {
      return db.attempts.where('sessionId').equals(sessionId).toArray();
    },
    async getAllAttempts(): Promise<GameAttempt[]> {
      return db.attempts.toArray();
    },
    async getAllWordProgress(): Promise<WordProgress[]> {
      return db.wordProgress.toArray();
    },
    async getAllReviewQueue(): Promise<import('@/domain/learning/types').ReviewQueueEntry[]> {
      return db.reviewQueue.toArray();
    },
    async getAllConfusionPairs(): Promise<ConfusionPair[]> {
      return db.confusionPairs.toArray();
    },
    async recordAttempt(attempt: GameAttempt): Promise<WordProgress> {
      return db.transaction('rw', db.wordProgress, db.attempts, db.reviewQueue, async () => {
        const current = (await db.wordProgress.get(attempt.wordId)) ?? createEmptyWordProgress(attempt.wordId);
        const updated = applyAttemptToProgress(current, attempt);
        await db.attempts.put(attempt);
        await db.wordProgress.put(updated);
        await db.reviewQueue.put({ wordId: updated.wordId, stage: updated.currentReviewStage, dueAt: updated.nextReviewAt ?? attempt.occurredAt, lastQuality: updated.lastQuality, reason: updated.lastQuality < 0.4 ? 'low-quality' : current.attemptCount === 0 ? 'new-word' : 'standard-review' });
        if (attempt.confusionWithWordId) {
          const pairKey = [attempt.wordId, attempt.confusionWithWordId].sort().join(':');
          const existing = await db.confusionPairs.get(pairKey);
          const confusion = recordConfusion(existing, { wordId: attempt.wordId, selectedAnswerId: attempt.confusionWithWordId, occurredAt: attempt.occurredAt });
          if (confusion) await db.confusionPairs.put(confusion);
        }
        return updated;
      });
    },
  };
}
