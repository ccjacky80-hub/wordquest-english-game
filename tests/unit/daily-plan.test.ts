import { describe, expect, it } from 'vitest';
import { createDailyMission, createDay1Mission, getDailyMission } from '@/content/daily-plan';

describe('official daily plan', () => {
  it('keeps the existing Day1 helper compatible while using official data', () => {
    const mission = createDay1Mission();
    expect(mission.dayIndex).toBe(1);
    expect(mission.newWordIds).toHaveLength(6);
    expect(mission.newWords.map((word) => word.id)).toEqual(mission.newWordIds);
    expect(mission.assignmentSource).toBe('official-day-plan');
    expect(mission.reviewWordIds).toEqual([]);
  });

  it('returns Day4 data by dayIndex', () => {
    const mission = getDailyMission(4);
    expect(mission.dayIndex).toBe(4);
    expect(mission.newWordIds).toHaveLength(5);
    expect(mission.reviewWordIds).toHaveLength(16);
    expect(mission.reviewRule).toBe('all-previous');
  });

  it('returns Day7 as a review-only mission for all 30 MVP words', () => {
    const mission = createDailyMission(7);
    expect(mission.newWordIds).toEqual([]);
    expect(mission.newWords).toEqual([]);
    expect(mission.reviewWordIds).toHaveLength(30);
    expect(mission.reviewWords).toHaveLength(30);
    expect(new Set(mission.reviewWordIds).size).toBe(30);
    expect(mission.reviewRule).toBe('all-mvp30');
    expect(mission.assignmentSource).toBe('official-day-plan');
  });

  it('rejects day indexes outside the official range', () => {
    expect(() => createDailyMission(0)).toThrow(RangeError);
    expect(() => createDailyMission(8)).toThrow(RangeError);
  });
});
