import { createDailyMission, type DailyMissionPlan } from './daily-plan';
import type { AttemptOutcome, GameAttempt } from '@/domain/learning/types';

export interface DailyProgressState {
  currentDayIndex: number;
  completedDayIndexes: number[];
  courseCompleted: boolean;
}

const SUCCESS_OUTCOMES: ReadonlySet<AttemptOutcome> = new Set([
  'independentCorrect',
  'correctAfterReplay',
  'correctAfterHint',
  'revealed',
]);

function daySessionPrefix(dayIndex: number): string {
  return `day${dayIndex}-`;
}

function hasSuccessfulAttempt(
  attempts: readonly GameAttempt[],
  dayIndex: number,
  wordId: string,
): boolean {
  const prefix = daySessionPrefix(dayIndex);
  return attempts.some(
    (attempt) =>
      attempt.sessionId.startsWith(prefix) &&
      attempt.wordId === wordId &&
      SUCCESS_OUTCOMES.has(attempt.outcome),
  );
}

export function isDailyMissionComplete(
  mission: Pick<DailyMissionPlan, 'dayIndex' | 'newWordIds' | 'reviewWordIds'>,
  attempts: readonly GameAttempt[],
): boolean {
  const targetWordIds = mission.newWordIds.length > 0 ? mission.newWordIds : mission.reviewWordIds;
  return targetWordIds.length > 0 && targetWordIds.every((wordId) => hasSuccessfulAttempt(attempts, mission.dayIndex, wordId));
}

export function computeDailyProgress(attempts: readonly GameAttempt[]): DailyProgressState {
  const completedDayIndexes: number[] = [];
  for (let dayIndex = 1; dayIndex <= 7; dayIndex += 1) {
    const mission = createDailyMission(dayIndex);
    if (!isDailyMissionComplete(mission, attempts)) break;
    completedDayIndexes.push(dayIndex);
  }

  const courseCompleted = completedDayIndexes.length === 7;
  return {
    currentDayIndex: courseCompleted ? 7 : completedDayIndexes.length + 1,
    completedDayIndexes,
    courseCompleted,
  };
}

export function getDailySessionId(
  dayIndex: number,
  gameType: 'treasure-hunt' | 'picture-match' | 'word-builder' | 'put-it-somewhere',
): string {
  if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > 7) {
    throw new RangeError(`dayIndex must be an integer from 1 to 7; received ${dayIndex}`);
  }
  return `day${dayIndex}-${gameType}`;
}
