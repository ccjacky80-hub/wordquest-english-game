'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChildPageFrame } from '@/components/child-ui/ChildPageFrame';
import { useCurrentDailyMission } from '@/content/use-current-daily-mission';
import type { ActivitySessionSuffix, DailyActivityProgress } from '@/content/progress-scheduler';

const ACTIVITY_DETAILS: Record<ActivitySessionSuffix, { label: string; task: string; href: string }> = {
  'treasure-hunt': { label: 'Listen & find', task: 'Listen for the word, then find the animal.', href: '/play/treasure-hunt' },
  'picture-match': { label: 'Look & match', task: 'Look at the picture and choose the word.', href: '/play/picture-match' },
  'word-builder': { label: 'Build words', task: 'Put the letters together to spell each word.', href: '/play/word-builder' },
  'put-it-somewhere': { label: 'Put it somewhere', task: 'Listen and drag the word to the right place.', href: '/play/put-it-somewhere' },
  'boss-mission': { label: 'Mini story boss', task: 'Use your words in a short animal story.', href: '/play/boss-mission' },
};

function ActivityCard({ progress, stepNumber }: { progress: DailyActivityProgress; stepNumber: number }) {
  const details = ACTIVITY_DETAILS[progress.suffix];
  const status = !progress.available
    ? 'Locked'
    : progress.complete
      ? 'Complete'
      : progress.required && stepNumber > 0
        ? 'Next'
        : 'Ready';
  const card = (
    <span className={`mission-activity-card mission-activity-${status.toLowerCase()}`} data-activity={progress.suffix}>
      <span className="mission-activity-number" aria-hidden="true">{progress.complete ? '✓' : stepNumber || '•'}</span>
      <span className="mission-activity-copy">
        <strong>{details.label}</strong>
        <span>{details.task}</span>
        <small>{progress.available ? `${progress.completedCount} of ${progress.targetCount} words` : 'Finish Day 3 to unlock'}</small>
      </span>
      <span className="mission-activity-status">{status}</span>
    </span>
  );
  if (!progress.available) return <div aria-label={`${details.label}, locked`}>{card}</div>;
  return <Link href={details.href} aria-label={`${details.label}, ${status}`}>{card}</Link>;
}

export default function MissionPage() {
  const { mission, currentDayIndex, courseCompleted, isLoading, activityProgress, completedMission } = useCurrentDailyMission();
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  useEffect(() => {
    setShowCompletionSummary(new URLSearchParams(window.location.search).get('completed') === '1');
  }, []);
  const requiredActivities = activityProgress.filter((activity) => activity.required);
  const completedCount = requiredActivities.filter((activity) => activity.complete).length;
  const nextActivity = requiredActivities.find((activity) => !activity.complete);
  const nextStepNumber = nextActivity ? requiredActivities.indexOf(nextActivity) + 1 : 0;
  const totalActivities = requiredActivities.length || (currentDayIndex >= 4 ? 5 : 4);
  const summaryDayIndex = completedMission?.dayIndex ?? (courseCompleted ? 7 : Math.max(1, currentDayIndex - 1));
  const summaryActivityCount = summaryDayIndex >= 4 ? 5 : 4;
  const displayMission = showCompletionSummary && completedMission ? completedMission : mission;

  return (
    <ChildPageFrame
      eyebrow={`DAY ${currentDayIndex} / TODAY'S MISSION`}
      title={showCompletionSummary || courseCompleted ? 'Today\'s practice is complete!' : `Day ${currentDayIndex}: help the animals!`}
      description={isLoading
        ? 'Loading your adventure...'
        : showCompletionSummary
          ? `You finished Day ${currentDayIndex} and all ${requiredActivities.length} activities.`
          : courseCompleted
            ? 'You completed the full Animal Kingdom course. You can replay any activity for extra practice.'
            : `Learn ${mission.newWords.length} new words and practise for about 15 minutes.`}
      backHref="/"
      backLabel="Home"
    >
      {showCompletionSummary || courseCompleted ? (
        <section className="mission-completion-summary" aria-labelledby="mission-complete-title">
          <p className="mission-summary-kicker">DAY {summaryDayIndex} COMPLETE</p>
          <h2 id="mission-complete-title">You finished today&apos;s practice!</h2>
          <p>{courseCompleted ? 'You completed the full Animal Kingdom course.' : `You completed all ${summaryActivityCount} activities for Day ${summaryDayIndex}.`}</p>
          <div className="mission-summary-choice" role="status">
            <strong>Want to keep practising?</strong>
            <span>You can replay any activity for extra practice, or finish for today.</span>
          </div>
          <div className="home-actions reward-actions">
            <Link className="primary-action" href={ACTIVITY_DETAILS[requiredActivities[0]?.suffix ?? 'treasure-hunt'].href}>Keep practising</Link>
            <Link className="secondary-action" href="/">Finish for today</Link>
          </div>
        </section>
      ) : (
        <div className="mission-progress-note" role="status">
          <strong>Step {nextStepNumber || totalActivities} of {totalActivities}: {nextActivity ? ACTIVITY_DETAILS[nextActivity.suffix].label : 'Replay any activity'}</strong>
          <span>{completedCount} of {totalActivities} activities complete. Choose the highlighted Next activity to keep going.</span>
        </div>
      )}
      <div className="mission-overview">
        <div className="mission-stat">
          <span className="stat-number">{displayMission.newWords.length}</span>
          <span>new words</span>
        </div>
        <div className="mission-stat">
          <span className="stat-number">15</span>
          <span>min practice</span>
        </div>
        <div className="mission-stat">
          <span className="stat-number">{showCompletionSummary || courseCompleted ? `${summaryActivityCount}/${summaryActivityCount}` : `${completedCount}/${totalActivities}`}</span>
          <span>activities done</span>
        </div>
      </div>
      <div className="word-preview-grid" aria-label="Today's new words">
        {displayMission.newWords.map((entry) => (
          <div className="word-preview" key={entry.id}>
            <img src={entry.imagePath} alt={entry.word} width={96} height={96} />
            <span>{entry.word}</span>
          </div>
        ))}
      </div>
      {showCompletionSummary || courseCompleted ? (
        <div className="mission-summary-activities" aria-label="Completed activities">
          <strong>Everything for today is done.</strong>
          <span>{summaryActivityCount} activities completed. Replay any activity above whenever you want more practice.</span>
        </div>
      ) : (
        <div className="mission-game-links" aria-label="Today's activities">
          {activityProgress.map((progress) => (
            <ActivityCard
              key={progress.suffix}
              progress={progress}
              stepNumber={progress.required ? requiredActivities.indexOf(progress) + 1 : 0}
            />
          ))}
        </div>
      )}
      <p className="mission-note">{showCompletionSummary || courseCompleted ? 'You can keep practising, or finish for today.' : "Finish each activity to complete today's practice. Completed activities stay open for replay."}</p>
    </ChildPageFrame>
  );
}
