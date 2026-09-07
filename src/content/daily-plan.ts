import dailyPlanData from '../../data/daily-plan.json';
import { getVocabularyEntry } from './loader';
import type { VocabularyEntry } from './schemas';

export type DailyPlanReviewRule = 'all-previous' | 'all-mvp30';

interface DailyPlanDayData {
  dayIndex: number;
  newWordIds: string[];
  reviewWordIds: string[];
  reviewRule: DailyPlanReviewRule;
}

interface DailyPlanData {
  schemaVersion: number;
  source: string;
  allocation: {
    basis: string;
    newWordCounts: Record<string, number>;
    totalNewWords: number;
  };
  days: DailyPlanDayData[];
}

export interface DailyMissionPlan {
  dayIndex: number;
  newWordIds: string[];
  newWords: VocabularyEntry[];
  reviewWordIds: string[];
  reviewWords: VocabularyEntry[];
  reviewRule: DailyPlanReviewRule;
  assignmentSource: 'official-day-plan';
}

const dailyPlan = dailyPlanData as DailyPlanData;

function getDailyPlanDay(dayIndex: number): DailyPlanDayData {
  if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > 7) {
    throw new RangeError(`dayIndex must be an integer from 1 to 7; received ${dayIndex}`);
  }
  const day = dailyPlan.days.find((candidate) => candidate.dayIndex === dayIndex);
  if (!day) {
    throw new Error(`Missing official daily plan for day ${dayIndex}`);
  }
  return day;
}

function resolveWords(wordIds: string[]): VocabularyEntry[] {
  return wordIds.map((wordId) => {
    const entry = getVocabularyEntry(wordId);
    if (!entry) {
      throw new Error(`Daily plan references unknown vocabulary entry: ${wordId}`);
    }
    return entry;
  });
}

export function createDailyMission(dayIndex: number): DailyMissionPlan {
  const day = getDailyPlanDay(dayIndex);
  return {
    dayIndex: day.dayIndex,
    newWordIds: [...day.newWordIds],
    newWords: resolveWords(day.newWordIds),
    reviewWordIds: [...day.reviewWordIds],
    reviewWords: resolveWords(day.reviewWordIds),
    reviewRule: day.reviewRule,
    assignmentSource: 'official-day-plan',
  };
}

export function getDailyMission(dayIndex: number): DailyMissionPlan {
  return createDailyMission(dayIndex);
}

export function createDay1Mission(): DailyMissionPlan {
  return createDailyMission(1);
}
