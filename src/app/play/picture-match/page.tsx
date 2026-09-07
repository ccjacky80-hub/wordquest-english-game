'use client';

import { PictureMatchGame } from '@/components/child-ui/PictureMatchGame';
import { useCurrentDailyMission } from '@/content/use-current-daily-mission';

export default function PictureMatchPage() {
  const { mission, currentDayIndex, isLoading } = useCurrentDailyMission();
  const words = mission.newWords.length > 0 ? mission.newWords : mission.reviewWords;
  if (isLoading) return <main className="game-shell"><p className="feedback-text">Loading your adventure...</p></main>;
  return <PictureMatchGame words={words} dayIndex={currentDayIndex} optionCount={4} />;
}
