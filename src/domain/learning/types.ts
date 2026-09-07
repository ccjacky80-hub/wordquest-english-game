export type AttemptOutcome =
  | 'independentCorrect'
  | 'correctAfterReplay'
  | 'correctAfterHint'
  | 'revealed'
  | 'wrong';

export interface GameAttempt {
  id: string;
  sessionId: string;
  gameType: string;
  wordId: string;
  outcome: AttemptOutcome;
  occurredAt: string;
  contentVersion: number;
}
