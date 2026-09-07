import type { GameAttempt } from '@/domain/learning/types';

export interface ProgressRepository {
  recordAttempt(attempt: GameAttempt): Promise<void>;
}

export function createProgressRepository(): ProgressRepository {
  return {
    async recordAttempt(_attempt: GameAttempt): Promise<void> {
      // Dexie-backed persistence is introduced in TASK-007.
    },
  };
}
