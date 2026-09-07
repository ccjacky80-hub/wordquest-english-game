'use client';

import { WordBuilderGame } from '@/components/child-ui/WordBuilderGame';
import { useCurrentDailyMission } from '@/content/use-current-daily-mission';

export default function WordBuilderPage() {
  const { mission, currentDayIndex, isLoading } = useCurrentDailyMission();
  const words = mission.newWords.length > 0 ? mission.newWords : mission.reviewWords;
  if (isLoading) return <main className="game-shell"><p className="feedback-text">Loading your adventure...</p></main>;
  return <WordBuilderGame words={words} dayIndex={currentDayIndex} />;
}
