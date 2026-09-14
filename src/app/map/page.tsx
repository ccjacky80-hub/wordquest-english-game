'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChildPageFrame } from '@/components/child-ui/ChildPageFrame';
import { getMvpEntries } from '@/content/loader';
import { createDailyMission } from '@/content/daily-plan';
import { computeDailyProgress, getDailyActivityProgress, type DailyActivityProgress } from '@/content/progress-scheduler';
import { createProgressRepository } from '@/db/repositories/progress-repository';

const mvpWords = getMvpEntries().slice(0, 6);

interface MapProgressState {
  isLoading: boolean;
  day1Complete: boolean;
  day1Activities: DailyActivityProgress[];
}

function MapNode({ entry, index, complete, active }: { entry: (typeof mvpWords)[number]; index: number; complete: boolean; active: boolean }) {
  const status = complete ? 'Complete' : active ? 'Practice now' : 'Locked';
  const node = (
    <span className={`map-node ${complete ? 'map-node-complete' : active ? 'map-node-active' : 'map-node-locked'}`}>
      <span className="map-node-number">{complete ? '✓' : index + 1}</span>
      <img src={entry.imagePath} alt="" width={112} height={112} />
      <strong>{status}</strong>
      <span>{entry.word}</span>
    </span>
  );
  if (!complete && !active) return <div aria-label={`${entry.word} locked`}>{node}</div>;
  return <Link href={complete ? '/mission?completed=1' : '/mission'} aria-label={`${entry.word}, ${status}`}>{node}</Link>;
}

export default function MapPage() {
  const [state, setState] = useState<MapProgressState>({ isLoading: true, day1Complete: false, day1Activities: [] });

  useEffect(() => {
    let cancelled = false;
    void createProgressRepository().getAllAttempts().then((attempts) => {
      if (cancelled) return;
      const progress = computeDailyProgress(attempts);
      const day1 = createDailyMission(1);
      setState({
        isLoading: false,
        day1Complete: progress.completedDayIndexes.includes(1),
        day1Activities: getDailyActivityProgress(day1, attempts).filter((activity) => activity.required),
      });
    });
    return () => { cancelled = true; };
  }, []);

  const completedActivities = state.day1Activities.filter((activity) => activity.complete).length;
  const totalActivities = state.day1Activities.length || 4;
  const progressPercent = state.isLoading ? 0 : Math.round((completedActivities / totalActivities) * 100);
  const day1Complete = state.day1Complete;

  return (
    <ChildPageFrame
      eyebrow="WORLD MAP / 世界地图"
      title="Animal Kingdom"
      description="Six animal friends join your map as you complete the Day 1 practice path."
      backHref="/"
      backLabel="Home"
    >
      <div className="map-progress" aria-label="Animal Kingdom progress">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span>{state.isLoading ? 'Loading progress...' : day1Complete ? 'Day 1 complete · 6 of 6 friends here' : `Day 1 practice · ${completedActivities} of ${totalActivities} activities complete`}</span>
      </div>
      <div className="map-board">
        {mvpWords.map((entry, index) => (
          <MapNode key={entry.id} entry={entry} index={index} complete={day1Complete} active={!day1Complete && index === 0} />
        ))}
      </div>
      <div className="map-callout">
        <span className="callout-icon" aria-hidden="true">✦</span>
        <p>{day1Complete ? "Day 1 is bright! Open the mission to replay today's activities or continue your learning path." : 'Complete every Day 1 activity to brighten all six animal friends.'}</p>
      </div>
    </ChildPageFrame>
  );
}
