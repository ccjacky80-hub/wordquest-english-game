import type { GameAttempt, WordProgress } from '@/domain/learning/types';
import { applyAttemptToProgress } from '@/domain/learning/mastery';
import { createEmptyWordProgress } from '@/domain/learning/types';
import { wordQuestDb, type WordQuestDB } from '../db';

export interface ProgressRepository {
  getWordProgress(wordId: string): Promise<WordProgress | undefined>;
  getAttemptsBySession(sessionId: string): Promise<GameAttempt[]>;
  getAllAttempts(): Promise<GameAttempt[]>;
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
    async recordAttempt(attempt: GameAttempt): Promise<WordProgress> {
      return db.transaction('rw', db.wordProgress, db.attempts, async () => {
        const current = (await db.wordProgress.get(attempt.wordId)) ?? createEmptyWordProgress(attempt.wordId);
        const updated = applyAttemptToProgress(current, attempt);
        await db.attempts.put(attempt);
        await db.wordProgress.put(updated);
        return updated;
      });
    },
  };
}
