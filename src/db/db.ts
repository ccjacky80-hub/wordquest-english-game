import Dexie, { type Table } from 'dexie';
import type {
  AppSettings,
  ConfusionPair,
  GameAttempt,
  LearningSession,
  LocalEvent,
  RewardState,
  ReviewQueueEntry,
  WordProgress,
} from '@/domain/learning/types';
import type { WordQuestTables } from './schema';

export class WordQuestDB extends Dexie implements WordQuestTables {
  wordProgress!: Table<WordProgress, string>;
  attempts!: Table<GameAttempt, string>;
  reviewQueue!: Table<ReviewQueueEntry, string>;
  confusionPairs!: Table<ConfusionPair, string>;
  sessions!: Table<LearningSession, string>;
  rewards!: Table<RewardState, string>;
  settings!: Table<AppSettings, string>;
  localEvents!: Table<LocalEvent, string>;

  constructor(name = 'wordquest') {
    super(name);
    this.version(1).stores({
      wordProgress: '&wordId, masteryLevel, nextReviewAt, lastSeenAt',
      attempts: '&id, wordId, sessionId, occurredAt',
      reviewQueue: '&wordId, dueAt, stage, reason',
      confusionPairs: '&pairKey, wordAId, wordBId, lastOccurredAt',
      sessions: '&id, planDate, startedAt, status',
      rewards: '&id, updatedAt',
      settings: '&id, dataSchemaVersion',
      localEvents: '&id, type, occurredAt',
    });
  }
}

export const wordQuestDb = new WordQuestDB();
