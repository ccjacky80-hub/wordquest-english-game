'use client';

import Link from 'next/link';
import { ChildPageFrame } from '@/components/child-ui/ChildPageFrame';
import { useCurrentDailyMission } from '@/content/use-current-daily-mission';

export default function MissionPage() {
  const { mission, currentDayIndex, courseCompleted, isLoading } = useCurrentDailyMission();

  return (
    <ChildPageFrame
      eyebrow={`DAY ${currentDayIndex} / TODAY&apos;S MISSION`}
      title={courseCompleted ? 'Seven days complete!' : `Day ${currentDayIndex}: help the animals!`}
      description={isLoading
        ? 'Loading your adventure...'
        : courseCompleted
          ? 'You completed the full Animal Kingdom course. Keep your word trail bright with review.'
          : `Today&apos;s path has ${mission.newWords.length} new words and ${mission.reviewWords.length} review words.`}
      backHref="/"
      backLabel="Home"
    >
      <div className="mission-overview">
        <div className="mission-stat">
          <span className="stat-number">{mission.newWords.length}</span>
          <span>new words</span>
        </div>
        <div className="mission-stat">
          <span className="stat-number">10</span>
          <span>min adventure</span>
        </div>
        <div className="mission-stat">
          <span className="stat-number">✦</span>
          <span>world reward</span>
        </div>
      </div>
      <div className="word-preview-grid" aria-label="Today&apos;s new words">
        {mission.newWords.map((entry) => (
          <div className="word-preview" key={entry.id}>
            <img src={entry.imagePath} alt={entry.word} width={96} height={96} />
            <span>{entry.word}</span>
          </div>
        ))}
      </div>
      <div className="mission-game-links">
        <Link className="primary-action wide-action" href="/play/treasure-hunt">
          Listen &amp; find
        </Link>
        <Link className="secondary-action wide-action" href="/play/picture-match">
          Look &amp; match
        </Link>
        <Link className="secondary-action wide-action" href="/play/word-builder">
          Build words
        </Link>
        <Link className="secondary-action wide-action" href="/play/put-it-somewhere">
          Put it somewhere
        </Link>
      </div>
      <p className="mission-note">You can listen again or look again whenever you need.</p>
    </ChildPageFrame>
  );
}
