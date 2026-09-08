import type { GameAttempt, WordProgress } from '@/domain/learning/types';
import { applyAttemptToProgress } from '@/domain/learning/mastery';
import { createEmptyWordProgress } from '@/domain/learning/types';
import { wordQuestDb, type WordQuestDB } from '../db';

export interface ProgressRepository {
  getWordProgress(wordId: string): Promise<WordProgress | undefined>;
  getAttemptsBySession(sessionId: string): Promise<GameAttempt[]>;
  getAllAttempts(): Promise<GameAttempt[]>;
  getAllWordProgress(): Promise<WordProgress[]>;
  getAllReviewQueue(): Promise<import('@/domain/learning/types').ReviewQueueEntry[]>;
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
    async recordAttempt(attempt: GameAttempt): Promise<WordProgress> {
      return db.transaction('rw', db.wordProgress, db.attempts, db.reviewQueue, async () => {
        const current = (await db.wordProgress.get(attempt.wordId)) ?? createEmptyWordProgress(attempt.wordId);
        const updated = applyAttemptToProgress(current, attempt);
        await db.attempts.put(attempt);
        await db.wordProgress.put(updated);
        await db.reviewQueue.put({ wordId: updated.wordId, stage: updated.currentReviewStage, dueAt: updated.nextReviewAt ?? attempt.occurredAt, lastQuality: updated.lastQuality, reason: updated.lastQuality < 0.4 ? 'low-quality' : current.attemptCount === 0 ? 'new-word' : 'standard-review' });
        return updated;
      });
    },
  };
}
