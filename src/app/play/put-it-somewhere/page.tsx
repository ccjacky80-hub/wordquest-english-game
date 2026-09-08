'use client';

import { PutItSomewhereGame } from '@/components/child-ui/PutItSomewhereGame';
import { useCurrentDailyMission } from '@/content/use-current-daily-mission';
import { createDragMissions } from '@/content/drag-missions';
import { NoReviewState } from '@/components/child-ui/NoReviewState';

export default function PutItSomewherePage() {
  const { mission, currentDayIndex, isLoading } = useCurrentDailyMission();
  const words = mission.newWords.length > 0 ? mission.newWords : mission.reviewWords;
  const dragMissions = createDragMissions(words);
  if (isLoading) return <main className="game-shell"><p className="feedback-text">Loading your adventure...</p></main>;
  if (dragMissions.length === 0) return <NoReviewState />;
  return <PutItSomewhereGame missions={dragMissions} dayIndex={currentDayIndex} />;
}
