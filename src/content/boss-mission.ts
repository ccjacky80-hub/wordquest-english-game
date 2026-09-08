import { createDailyMission } from './daily-plan';
import { computeDailyProgress } from './progress-scheduler';
import { getVocabularyEntry } from './loader';
import type { GameAttempt } from '@/domain/learning/types';
import type { VocabularyEntry } from './schemas';

export const BOSS_UNLOCK_DAY = 3;
export const BOSS_MIN_LEARNED_WORDS = 6;

export interface BossProgress {
  unlocked: boolean;
  learnedWordIds: string[];
  reason: string;
}

export interface BossStep {
  id: 'find-eagle' | 'place-feather' | 'move-eagle';
  kind: 'find' | 'drag' | 'classification';
  instruction: string;
  source: VocabularyEntry;
  targetLabel: string;
  targetWordId?: string;
}

function successfulWordIds(attempts: readonly GameAttempt[]): Set<string> {
  return new Set(
    attempts
      .filter((attempt) => attempt.outcome !== 'wrong')
      .map((attempt) => attempt.wordId),
  );
}

export function getBossLearnedWordIds(attempts: readonly GameAttempt[]): string[] {
  const completedThroughDay3 = [1, 2, 3].flatMap((dayIndex) => createDailyMission(dayIndex).newWordIds);
  const successful = successfulWordIds(attempts);
  return completedThroughDay3.filter((wordId) => successful.has(wordId));
}

export function getBossProgress(attempts: readonly GameAttempt[]): BossProgress {
  const learnedWordIds = getBossLearnedWordIds(attempts);
  const dailyProgress = computeDailyProgress(attempts);
  const unlocked = dailyProgress.completedDayIndexes.includes(BOSS_UNLOCK_DAY)
    && learnedWordIds.length >= BOSS_MIN_LEARNED_WORDS;
  return {
    unlocked,
    learnedWordIds,
    reason: unlocked
      ? 'Animal Kingdom Boss Mission unlocked.'
      : `Complete Day3 and learn at least ${BOSS_MIN_LEARNED_WORDS} words to unlock this story.`,
  };
}

export function createBossSteps(attempts: readonly GameAttempt[]): BossStep[] | undefined {
  if (!getBossProgress(attempts).unlocked) return undefined;
  const learned = getBossLearnedWordIds(attempts);
  const storyWords = learned.map((wordId) => getVocabularyEntry(wordId)).filter((word): word is VocabularyEntry => word !== undefined).slice(0, 3);
  if (storyWords.length < 3) return undefined;
  const [character, object, actionWord] = storyWords;
  return [
    { id: 'find-eagle', kind: 'find', instruction: `Find the ${character.word} in the story.`, source: character, targetLabel: character.word, targetWordId: character.id },
    { id: 'place-feather', kind: 'drag', instruction: `Put the ${object.word} near the ${character.word}.`, source: object, targetLabel: character.word, targetWordId: character.id },
    { id: 'move-eagle', kind: 'classification', instruction: `Move the ${actionWord.word} to the sky.`, source: actionWord, targetLabel: 'sky' },
  ];
}
