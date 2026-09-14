'use client';

import { useEffect, useState } from 'react';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { computeDailyProgress, getDailyActivityProgress, type DailyActivityProgress } from './progress-scheduler';
import { createDailyMission, type DailyMissionPlan } from './daily-plan';
import { getDueReviewWordIds } from './review-queue';

export interface CurrentDailyMission {
  mission: DailyMissionPlan;
  currentDayIndex: number;
  courseCompleted: boolean;
  isLoading: boolean;
  activityProgress: DailyActivityProgress[];
  completedMission?: DailyMissionPlan;
}

export function useCurrentDailyMission(): CurrentDailyMission {
  const [currentDayIndex, setCurrentDayIndex] = useState(1);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dueReviewIds, setDueReviewIds] = useState<string[]>([]);
  const [activityProgress, setActivityProgress] = useState<DailyActivityProgress[]>([]);
  const [completedMission, setCompletedMission] = useState<DailyMissionPlan>();

  useEffect(() => {
    let cancelled = false;
    const repository = createProgressRepository();
    void Promise.all([repository.getAllAttempts(), repository.getAllWordProgress()]).then(([attempts, wordProgress]) => {
      if (cancelled) return;
       const progress = computeDailyProgress(attempts);
       const plan = createDailyMission(progress.currentDayIndex);
       const completedDayIndex = progress.courseCompleted ? 7 : progress.currentDayIndex - 1;
       if (completedDayIndex >= 1) setCompletedMission(createDailyMission(completedDayIndex));

       setCurrentDayIndex(progress.currentDayIndex);
       setDueReviewIds(getDueReviewWordIds(plan, wordProgress, new Date().toISOString()));
       setActivityProgress(getDailyActivityProgress(plan, attempts));
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
    activityProgress,
    completedMission,
  };
}
