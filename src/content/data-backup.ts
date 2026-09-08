import { z } from 'zod';
import type { GameAttempt, WordProgress } from '@/domain/learning/types';

const gameAttemptSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  gameType: z.string(),
  wordId: z.string(),
  promptType: z.string(),
  outcome: z.enum(['independentCorrect', 'correctAfterReplay', 'correctAfterHint', 'revealed', 'wrong']),
  attemptIndex: z.number(),
  hintsUsed: z.number(),
  audioReplayCount: z.number(),
  occurredAt: z.string(),
  contentVersion: z.number(),
}).passthrough();

const wordProgressSchema = z.object({
  wordId: z.string(),
  masteryLevel: z.number().int().min(0).max(5),
  currentReviewStage: z.number(),
  independentCorrectCount: z.number(),
  assistedCorrectCount: z.number(),
  wrongCount: z.number(),
  attemptCount: z.number(),
  lastQuality: z.number(),
  version: z.number(),
}).passthrough();

export const dataBackupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  attempts: z.array(gameAttemptSchema),
  wordProgress: z.array(wordProgressSchema),
});

export interface DataBackupPayload {
  schemaVersion: 1;
  exportedAt: string;
  attempts: GameAttempt[];
  wordProgress: WordProgress[];
}

export function createDataBackup(attempts: GameAttempt[], wordProgress: WordProgress[]): DataBackupPayload {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), attempts, wordProgress };
}

export function parseDataBackup(input: unknown): DataBackupPayload {
  const parsed = dataBackupSchema.parse(input);
  return { schemaVersion: 1, exportedAt: parsed.exportedAt, attempts: parsed.attempts as unknown as GameAttempt[], wordProgress: parsed.wordProgress as unknown as WordProgress[] };
}
