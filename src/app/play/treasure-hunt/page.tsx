'use client';

import { TreasureHuntGame } from '@/components/child-ui/TreasureHuntGame';
import { useCurrentDailyMission } from '@/content/use-current-daily-mission';

export default function TreasureHuntPage() {
  const { mission, currentDayIndex, isLoading } = useCurrentDailyMission();
  const words = mission.newWords.length > 0 ? mission.newWords : mission.reviewWords;
  if (isLoading) return <main className="game-shell"><p className="feedback-text">Loading your adventure...</p></main>;
  return <TreasureHuntGame words={words} dayIndex={currentDayIndex} />;
}
