'use client';

import { useEffect, useState } from 'react';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { computeDailyProgress } from './progress-scheduler';
import { createDailyMission, type DailyMissionPlan } from './daily-plan';
import { getDueReviewWordIds } from './review-queue';

export interface CurrentDailyMission {
  mission: DailyMissionPlan;
  currentDayIndex: number;
  courseCompleted: boolean;
  isLoading: boolean;
}

export function useCurrentDailyMission(): CurrentDailyMission {
  const [currentDayIndex, setCurrentDayIndex] = useState(1);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dueReviewIds, setDueReviewIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const repository = createProgressRepository();
    void Promise.all([repository.getAllAttempts(), repository.getAllWordProgress()]).then(([attempts, wordProgress]) => {
      if (cancelled) return;
      const progress = computeDailyProgress(attempts);
      const plan = createDailyMission(progress.currentDayIndex);
      setCurrentDayIndex(progress.currentDayIndex);
      setDueReviewIds(getDueReviewWordIds(plan, wordProgress, new Date().toISOString()));
      setCourseCompleted(progress.courseCompleted);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const mission = createDailyMission(currentDayIndex);
  const dueReviewWords = mission.reviewWords.filter((word) => dueReviewIds.includes(word.id));
  return {
    mission: { ...mission, reviewWords: dueReviewWords, reviewWordIds: dueReviewWords.map((word) => word.id) },
    currentDayIndex,
    courseCompleted,
    isLoading,
  };
}
