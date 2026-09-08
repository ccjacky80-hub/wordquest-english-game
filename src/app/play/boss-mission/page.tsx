'use client';

import { useEffect, useState } from 'react';
import { BossMissionGame } from '@/components/child-ui/BossMissionGame';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { createBossSteps, getBossProgress } from '@/content/boss-mission';
import { useCurrentDailyMission } from '@/content/use-current-daily-mission';

export default function BossMissionPage() {
  const { currentDayIndex, isLoading: missionLoading } = useCurrentDailyMission();
  const [attempts, setAttempts] = useState<Awaited<ReturnType<ReturnType<typeof createProgressRepository>['getAllAttempts']>>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void createProgressRepository().getAllAttempts().then((saved) => { setAttempts(saved); setLoading(false); });
  }, []);
  if (missionLoading || loading) return <main className="game-shell"><p className="feedback-text">Loading your story...</p></main>;
  const progress = getBossProgress(attempts);
  const steps = createBossSteps(attempts);
  if (!progress.unlocked || !steps) return <main className="child-shell home-shell"><section className="reward-card"><p className="eyebrow">BOSS MISSION / 故事关卡</p><h1>Keep learning before the story begins.</h1><p>{progress.reason}</p><p>You have learned {progress.learnedWordIds.length} words so far.</p><a className="primary-action" href="/mission">Back to today&apos;s mission</a></section></main>;
  return <BossMissionGame steps={steps} dayIndex={Math.min(7, Math.max(3, currentDayIndex))} />;
}
