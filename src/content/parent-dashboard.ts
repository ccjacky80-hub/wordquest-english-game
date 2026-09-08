import { createDailyMission } from './daily-plan';
import { computeDailyProgress, type DailyProgressState } from './progress-scheduler';
import { getVocabularyEntry } from './loader';
import type { ConfusionPair, GameAttempt, WordProgress } from '@/domain/learning/types';
import { aggregateConfusionPairs } from './confusion-summary';
import { getProblemWords, groupVocabulary, parentVocabularyGroup, type ParentVocabularyGroup, type ProblemWord } from './parent-vocabulary';
import { recentLocalEvents, summarizeLocalEvents } from './local-telemetry';
import type { LocalEvent } from '@/domain/learning/types';

export interface GamePerformance {
  gameType: string;
  attempts: number;
  correct: number;
  accuracy: number;
  words: number;
}

export interface ParentWordRow {
  wordId: string;
  word: string;
  masteryLevel: number;
  independentCorrectCount: number;
  assistedCorrectCount: number;
  wrongCount: number;
  lastSeenAt?: string;
}

export interface ParentDashboardSnapshot {
  dailyProgress: DailyProgressState;
  overallAccuracy: number;
  totalAttempts: number;
  totalCorrect: number;
  gamePerformance: GamePerformance[];
  words: ParentWordRow[];
  recentActivity: GameAttempt[];
  confusionPairs: ConfusionPair[];
  vocabularyGroups: Record<ParentVocabularyGroup, WordProgress[]>;
  problemWords: ProblemWord[];
  localEventSummary: ReturnType<typeof summarizeLocalEvents>;
}

const GAME_LABELS: Record<string, string> = {
  'treasure-hunt': 'G1 Listen & Find',
  'picture-match': 'G2 Picture Match',
  'word-builder': 'G3 Word Builder',
  'put-it-somewhere': 'G4 Put It Somewhere',
  'mini-story': 'G5 Boss Mission',
};

export function buildParentDashboardSnapshot(
  attempts: readonly GameAttempt[],
  progress: readonly WordProgress[],
  localEvents: readonly LocalEvent[] = [],
): ParentDashboardSnapshot {
  const totalAttempts = attempts.length;
  const totalCorrect = attempts.filter((attempt) => attempt.outcome !== 'wrong').length;
  const grouped = new Map<string, GameAttempt[]>();
  for (const attempt of attempts) grouped.set(attempt.gameType, [...(grouped.get(attempt.gameType) ?? []), attempt]);
  const gamePerformance = [...grouped.entries()].map(([gameType, gameAttempts]) => {
    const correct = gameAttempts.filter((attempt) => attempt.outcome !== 'wrong').length;
    return { gameType, attempts: gameAttempts.length, correct, accuracy: gameAttempts.length ? Math.round((correct / gameAttempts.length) * 100) : 0, words: new Set(gameAttempts.map((attempt) => attempt.wordId)).size };
  }).sort((a, b) => a.gameType.localeCompare(b.gameType));
  const words = progress.map((entry) => ({ wordId: entry.wordId, word: getVocabularyEntry(entry.wordId)?.word ?? entry.wordId, masteryLevel: entry.masteryLevel, independentCorrectCount: entry.independentCorrectCount, assistedCorrectCount: entry.assistedCorrectCount, wrongCount: entry.wrongCount, lastSeenAt: entry.lastSeenAt })).sort((a, b) => b.masteryLevel - a.masteryLevel || a.word.localeCompare(b.word));
  const recentActivity = [...attempts].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 10);
  const now = new Date().toISOString();
  return { dailyProgress: computeDailyProgress(attempts), overallAccuracy: totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0, totalAttempts, totalCorrect, gamePerformance, words, recentActivity, confusionPairs: aggregateConfusionPairs(attempts), vocabularyGroups: groupVocabulary(progress, now), problemWords: getProblemWords(progress, attempts, now), localEventSummary: summarizeLocalEvents(recentLocalEvents(localEvents, now)) };
}

export function gameLabel(gameType: string): string { return GAME_LABELS[gameType] ?? gameType; }
export function masteryLabel(level: number): string { return ['New', 'Seen', 'Recognized', 'Recalled', 'Used', 'Mastered'][level] ?? `Level ${level}`; }
