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

const CORE_ACTIVITY_SUFFIXES = [
  'treasure-hunt',
  'picture-match',
  'word-builder',
  'put-it-somewhere',
] as const;
const BOSS_ACTIVITY_SUFFIX = 'boss-mission';
const BOSS_ACTIVITY_START_DAY = 4;
const BOSS_ACTIVITY_WORD_COUNT = 3;

export type ActivitySessionSuffix = (typeof CORE_ACTIVITY_SUFFIXES)[number] | typeof BOSS_ACTIVITY_SUFFIX;
const ALL_ACTIVITY_SUFFIXES: readonly ActivitySessionSuffix[] = [...CORE_ACTIVITY_SUFFIXES, BOSS_ACTIVITY_SUFFIX];

export interface DailyActivityProgress {
  suffix: ActivitySessionSuffix;
  complete: boolean;
  available: boolean;
  required: boolean;
  completedCount: number;
  targetCount: number;
}

export function getDailyActivityProgress(
  mission: Pick<DailyMissionPlan, 'dayIndex' | 'newWordIds' | 'reviewWordIds'>,
  attempts: readonly GameAttempt[],
): DailyActivityProgress[] {
  const targetWordIds = mission.newWordIds.length > 0 ? mission.newWordIds : mission.reviewWordIds;
  const requiredSuffixes = requiredActivitySuffixes(mission.dayIndex);
  return ALL_ACTIVITY_SUFFIXES.map((suffix) => {
    const available = suffix !== BOSS_ACTIVITY_SUFFIX || mission.dayIndex >= BOSS_ACTIVITY_START_DAY;
    const successfulWordIds = successfulWordIdsForActivity(attempts, mission.dayIndex, suffix);
    const targetCount = suffix === BOSS_ACTIVITY_SUFFIX
      ? Math.min(BOSS_ACTIVITY_WORD_COUNT, targetWordIds.length)
      : targetWordIds.length;
    return {
      suffix,
      complete: available && targetCount > 0 && (suffix === BOSS_ACTIVITY_SUFFIX
        ? successfulWordIds.size >= targetCount
        : targetWordIds.every((wordId) => successfulWordIds.has(wordId))),
      available,
      required: requiredSuffixes.includes(suffix),
      completedCount: suffix === BOSS_ACTIVITY_SUFFIX
        ? Math.min(successfulWordIds.size, targetCount)
        : targetWordIds.filter((wordId) => successfulWordIds.has(wordId)).length,
      targetCount,
    };
  });
}

function activitySessionId(dayIndex: number, suffix: ActivitySessionSuffix): string {
  return `day${dayIndex}-${suffix}`;
}

function requiredActivitySuffixes(dayIndex: number): readonly ActivitySessionSuffix[] {
  return dayIndex >= BOSS_ACTIVITY_START_DAY
    ? [...CORE_ACTIVITY_SUFFIXES, BOSS_ACTIVITY_SUFFIX]
    : CORE_ACTIVITY_SUFFIXES;
}

function successfulWordIdsForActivity(
  attempts: readonly GameAttempt[],
  dayIndex: number,
  suffix: ActivitySessionSuffix,
): Set<string> {
  return new Set(
    attempts
      .filter((attempt) => attempt.sessionId === activitySessionId(dayIndex, suffix) && SUCCESS_OUTCOMES.has(attempt.outcome))
      .map((attempt) => attempt.wordId),
  );
}

function isActivityComplete(
  targetWordIds: readonly string[],
  attempts: readonly GameAttempt[],
  dayIndex: number,
  suffix: ActivitySessionSuffix,
): boolean {
  const successfulWordIds = successfulWordIdsForActivity(attempts, dayIndex, suffix);
  if (suffix === BOSS_ACTIVITY_SUFFIX) {
    return successfulWordIds.size >= Math.min(BOSS_ACTIVITY_WORD_COUNT, targetWordIds.length);
  }
  return targetWordIds.length > 0 && targetWordIds.every((wordId) => successfulWordIds.has(wordId));
}

export function isDailyMissionComplete(
  mission: Pick<DailyMissionPlan, 'dayIndex' | 'newWordIds' | 'reviewWordIds'>,
  attempts: readonly GameAttempt[],
): boolean {
  const targetWordIds = mission.newWordIds.length > 0 ? mission.newWordIds : mission.reviewWordIds;
  return targetWordIds.length > 0 && requiredActivitySuffixes(mission.dayIndex)
    .every((suffix) => isActivityComplete(targetWordIds, attempts, mission.dayIndex, suffix));
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
  gameType: 'treasure-hunt' | 'picture-match' | 'word-builder' | 'put-it-somewhere' | 'boss-mission',
): string {
  if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > 7) {
    throw new RangeError(`dayIndex must be an integer from 1 to 7; received ${dayIndex}`);
  }
  return `day${dayIndex}-${gameType}`;
}
