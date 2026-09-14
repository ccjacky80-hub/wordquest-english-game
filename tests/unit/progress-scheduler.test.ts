import { describe, expect, it } from 'vitest';
import { createDailyMission } from '@/content/daily-plan';
import { computeDailyProgress, getDailyActivityProgress, isDailyMissionComplete } from '@/content/progress-scheduler';
import type { GameAttempt } from '@/domain/learning/types';

type Activity = 'treasure-hunt' | 'picture-match' | 'word-builder' | 'put-it-somewhere' | 'boss-mission';

function attempt(dayIndex: number, wordId: string, outcome: GameAttempt['outcome'] = 'independentCorrect', activity: Activity = 'picture-match'): GameAttempt {
  return {
    id: `${dayIndex}-${activity}-${wordId}-${outcome}`,
    sessionId: `day${dayIndex}-${activity}`,
    gameType: activity === 'boss-mission' ? 'mini-story' : activity,
    wordId,
    promptType: 'image-to-word',
    outcome,
    attemptIndex: 1,
    hintsUsed: outcome === 'correctAfterHint' ? 1 : 0,
    audioReplayCount: 0,
    occurredAt: '2026-09-08T10:00:00.000Z',
    contentVersion: 1,
  };
}

const CORE_ACTIVITIES: Activity[] = ['treasure-hunt', 'picture-match', 'word-builder', 'put-it-somewhere'];

function completeCoreActivities(dayIndex: number, wordIds: readonly string[]): GameAttempt[] {
  return CORE_ACTIVITIES.flatMap((activity) => wordIds.map((wordId) => attempt(dayIndex, wordId, 'independentCorrect', activity)));
}

describe('daily progress scheduler', () => {
  it('stays on Day1 when the current day is interrupted', () => {
    const day1 = createDailyMission(1);
    const progress = computeDailyProgress([attempt(1, day1.newWordIds[0])]);
    expect(progress.currentDayIndex).toBe(1);
    expect(progress.completedDayIndexes).toEqual([]);
    expect(progress.courseCompleted).toBe(false);
  });

  it('does not complete a day after only one activity succeeds', () => {
    const day1 = createDailyMission(1);
    const activityAttempts = day1.newWordIds.map((wordId) => attempt(1, wordId));
    const activityProgress = getDailyActivityProgress(day1, activityAttempts);
    expect(activityProgress.find((activity) => activity.suffix === 'picture-match')?.complete).toBe(true);
    expect(activityProgress.filter((activity) => activity.required && activity.complete)).toHaveLength(1);
    expect(isDailyMissionComplete(day1, activityAttempts)).toBe(false);
    expect(computeDailyProgress(activityAttempts).currentDayIndex).toBe(1);
  });

  it('advances exactly one day after every core activity succeeds', () => {
    const day1 = createDailyMission(1);
    const day1Attempts = completeCoreActivities(1, day1.newWordIds);
    const progress = computeDailyProgress(day1Attempts);
    expect(isDailyMissionComplete(day1, day1Attempts)).toBe(true);
    expect(progress.currentDayIndex).toBe(2);
    expect(progress.completedDayIndexes).toEqual([1]);
  });

  it('does not skip an incomplete day even when later attempts exist', () => {
    const day1 = createDailyMission(1);
    const day2 = createDailyMission(2);
    const attempts = [
      ...completeCoreActivities(1, day1.newWordIds).slice(0, -1),
      ...completeCoreActivities(2, day2.newWordIds),
    ];
    expect(computeDailyProgress(attempts).currentDayIndex).toBe(1);
  });

  it('requires the boss activity from Day4 onward', () => {
    const day4 = createDailyMission(4);
    const coreAttempts = completeCoreActivities(4, day4.newWordIds);
    const coreOnlyProgress = getDailyActivityProgress(day4, coreAttempts);
    expect(coreOnlyProgress.find((activity) => activity.suffix === 'boss-mission')).toMatchObject({ available: true, required: true, complete: false });
    expect(isDailyMissionComplete(day4, coreAttempts)).toBe(false);

    const bossAttempts = day4.newWordIds.slice(0, 3).map((wordId) => attempt(4, wordId, 'independentCorrect', 'boss-mission'));
    expect(isDailyMissionComplete(day4, [...coreAttempts, ...bossAttempts])).toBe(true);
  });

  it('marks the course complete after all Day7 activities succeed', () => {
    const completedDays = Array.from({ length: 6 }, (_, index) => {
      const mission = createDailyMission(index + 1);
      const coreAttempts = completeCoreActivities(index + 1, mission.newWordIds);
      const bossAttempts = index + 1 >= 4
        ? mission.newWordIds.slice(0, 3).map((wordId) => attempt(index + 1, wordId, 'correctAfterHint', 'boss-mission'))
        : [];
      return [...coreAttempts, ...bossAttempts];
    }).flat();
    const day7 = createDailyMission(7);
    const progress = computeDailyProgress([
      ...completedDays,
      ...completeCoreActivities(7, day7.reviewWordIds),
      ...day7.reviewWordIds.slice(0, 3).map((wordId) => attempt(7, wordId, 'correctAfterHint', 'boss-mission')),
    ]);
    expect(progress.currentDayIndex).toBe(7);
    expect(progress.completedDayIndexes).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(progress.courseCompleted).toBe(true);
  });
});
