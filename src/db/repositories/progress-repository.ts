import type { ConfusionPair, GameAttempt, WordProgress } from '@/domain/learning/types';
import { recordConfusion } from '@/domain/learning/confusion';
import { applyAttemptToProgress } from '@/domain/learning/mastery';
import { createEmptyWordProgress } from '@/domain/learning/types';
import { wordQuestDb, type WordQuestDB } from '../db';
import type { DataBackupPayload } from '@/content/data-backup';

export interface ProgressRepository {
  getWordProgress(wordId: string): Promise<WordProgress | undefined>;
  getAttemptsBySession(sessionId: string): Promise<GameAttempt[]>;
  getAllAttempts(): Promise<GameAttempt[]>;
  getAllWordProgress(): Promise<WordProgress[]>;
  getAllReviewQueue(): Promise<import('@/domain/learning/types').ReviewQueueEntry[]>;
  getAllConfusionPairs(): Promise<ConfusionPair[]>;
  importData(payload: DataBackupPayload): Promise<void>;
  resetLearningData(): Promise<void>;
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
    async importData(payload: DataBackupPayload): Promise<void> {
      await db.transaction('rw', [db.attempts, db.wordProgress], async () => {
        await db.attempts.clear();
        await db.wordProgress.clear();
        await db.attempts.bulkPut(payload.attempts);
        await db.wordProgress.bulkPut(payload.wordProgress);
      });
    },
    async resetLearningData(): Promise<void> {
      await db.transaction('rw', [db.attempts, db.wordProgress, db.reviewQueue, db.confusionPairs, db.sessions, db.rewards], async () => {
        await Promise.all([db.attempts.clear(), db.wordProgress.clear(), db.reviewQueue.clear(), db.confusionPairs.clear(), db.sessions.clear(), db.rewards.clear()]);
      });
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
