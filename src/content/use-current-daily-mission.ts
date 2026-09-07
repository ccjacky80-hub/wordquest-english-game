'use client';

import { useEffect, useState } from 'react';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { computeDailyProgress } from './progress-scheduler';
import { createDailyMission, type DailyMissionPlan } from './daily-plan';

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

  useEffect(() => {
    let cancelled = false;
    const repository = createProgressRepository();
    void repository.getAllAttempts().then((attempts) => {
      if (cancelled) return;
      const progress = computeDailyProgress(attempts);
      setCurrentDayIndex(progress.currentDayIndex);
      setCourseCompleted(progress.courseCompleted);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    mission: createDailyMission(currentDayIndex),
    currentDayIndex,
    courseCompleted,
    isLoading,
  };
}
