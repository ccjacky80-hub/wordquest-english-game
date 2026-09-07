import type { Table } from 'dexie';
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

export interface WordQuestTables {
  wordProgress: Table<WordProgress, string>;
  attempts: Table<GameAttempt, string>;
  reviewQueue: Table<ReviewQueueEntry, string>;
  confusionPairs: Table<ConfusionPair, string>;
  sessions: Table<LearningSession, string>;
  rewards: Table<RewardState, string>;
  settings: Table<AppSettings, string>;
  localEvents: Table<LocalEvent, string>;
}
