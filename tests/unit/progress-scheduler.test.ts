import { describe, expect, it } from 'vitest';
import { createDailyMission } from '@/content/daily-plan';
import { computeDailyProgress, isDailyMissionComplete } from '@/content/progress-scheduler';
import type { GameAttempt } from '@/domain/learning/types';

function attempt(dayIndex: number, wordId: string, outcome: GameAttempt['outcome'] = 'independentCorrect'): GameAttempt {
  return {
    id: `${dayIndex}-${wordId}-${outcome}`,
    sessionId: `day${dayIndex}-picture-match`,
    gameType: 'picture-match',
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

describe('daily progress scheduler', () => {
  it('stays on Day1 when the current day is interrupted', () => {
    const day1 = createDailyMission(1);
    const progress = computeDailyProgress([attempt(1, day1.newWordIds[0])]);
    expect(progress.currentDayIndex).toBe(1);
    expect(progress.completedDayIndexes).toEqual([]);
    expect(progress.courseCompleted).toBe(false);
  });

  it('advances exactly one day after all current new words succeed', () => {
    const day1 = createDailyMission(1);
    const day1Attempts = day1.newWordIds.map((wordId) => attempt(1, wordId));
    const progress = computeDailyProgress(day1Attempts);
    expect(isDailyMissionComplete(day1, day1Attempts)).toBe(true);
    expect(progress.currentDayIndex).toBe(2);
    expect(progress.completedDayIndexes).toEqual([1]);
  });

  it('does not skip an incomplete day even when later attempts exist', () => {
    const day1 = createDailyMission(1);
    const day2 = createDailyMission(2);
    const attempts = [
      ...day1.newWordIds.slice(0, 5).map((wordId) => attempt(1, wordId)),
      ...day2.newWordIds.map((wordId) => attempt(2, wordId)),
    ];
    expect(computeDailyProgress(attempts).currentDayIndex).toBe(1);
  });

  it('marks the course complete after all Day7 review words succeed', () => {
    const completedDays = Array.from({ length: 6 }, (_, index) => {
      const mission = createDailyMission(index + 1);
      return mission.newWordIds.map((wordId) => attempt(index + 1, wordId));
    }).flat();
    const day7 = createDailyMission(7);
    const progress = computeDailyProgress([
      ...completedDays,
      ...day7.reviewWordIds.map((wordId) => attempt(7, wordId, 'correctAfterHint')),
    ]);
    expect(progress.currentDayIndex).toBe(7);
    expect(progress.completedDayIndexes).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(progress.courseCompleted).toBe(true);
  });
});
