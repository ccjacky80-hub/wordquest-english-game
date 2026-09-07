export type AttemptOutcome =
  | 'independentCorrect'
  | 'correctAfterReplay'
  | 'correctAfterHint'
  | 'revealed'
  | 'wrong';

export type GameType =
  | 'treasure-hunt'
  | 'picture-match'
  | 'word-builder'
  | 'put-it-somewhere'
  | 'mini-story';

export type PromptType =
  | 'audio-to-object'
  | 'image-to-word'
  | 'word-build'
  | 'instruction-action'
  | 'story-context';

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface GameAttempt {
  id: string;
  sessionId: string;
  gameType: GameType | string;
  wordId: string;
  relatedWordIds?: string[];
  promptType: PromptType;
  outcome: AttemptOutcome;
  attemptIndex: number;
  hintsUsed: number;
  audioReplayCount: number;
  responseTimeMs?: number;
  selectedAnswerId?: string;
  confusionWithWordId?: string;
  occurredAt: string;
  contentVersion: number;
}

export interface WordProgress {
  wordId: string;
  masteryLevel: MasteryLevel;
  listeningRecognition: number;
  visualRecognition: number;
  spelling: number;
  activeRecall: number;
  contextUse: number;
  memoryStrength: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastIndependentCorrectAt?: string;
  currentReviewStage: number;
  nextReviewAt?: string;
  independentCorrectCount: number;
  assistedCorrectCount: number;
  wrongCount: number;
  activeRecallCorrectCount: number;
  independentCorrectDates: string[];
  attemptCount: number;
  lastQuality: number;
  version: number;
}

export type ReviewReason =
  | 'new-word'
  | 'standard-review'
  | 'low-quality'
  | 'confusion'
  | 'manual';

export interface ReviewSchedule {
  wordId: string;
  stage: number;
  dueAt: string;
  lastQuality: number;
  reason: ReviewReason;
}

export type ReviewQueueEntry = ReviewSchedule;

export interface ConfusionPair {
  pairKey: string;
  wordAId: string;
  wordBId: string;
  count: number;
  lastOccurredAt: string;
  resolvedEvidenceCount: number;
}

export interface LearningSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  planDate: string;
  dayIndex?: number;
  newWordIds: string[];
  reviewWordIds: string[];
  completedWordIds: string[];
  attempts: number;
  independentCorrect: number;
  hintsUsed: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface RewardState {
  id: 'main';
  stars: number;
  unlockedAnimalIds: string[];
  unlockedDecorationIds: string[];
  completedMissionIds: string[];
  updatedAt: string;
}

export interface AppSettings {
  id: 'main';
  audioEnabled: boolean;
  musicEnabled: boolean;
  reducedMotion: boolean;
  showChineseFallback: boolean;
  onboardingCompleted: boolean;
  dataSchemaVersion: number;
}

export interface LocalEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export function createEmptyWordProgress(wordId: string): WordProgress {
  return {
    wordId,
    masteryLevel: 0,
    listeningRecognition: 0,
    visualRecognition: 0,
    spelling: 0,
    activeRecall: 0,
    contextUse: 0,
    memoryStrength: 0,
    currentReviewStage: 0,
    independentCorrectCount: 0,
    assistedCorrectCount: 0,
    wrongCount: 0,
    activeRecallCorrectCount: 0,
    independentCorrectDates: [],
    attemptCount: 0,
    lastQuality: 0,
    version: 1,
  };
}
