import Link from 'next/link';
import { ChildPageFrame } from '@/components/child-ui/ChildPageFrame';
import { createDay1Mission } from '@/content/daily-plan';

export default function MissionPage() {
  const mission = createDay1Mission();

  return (
    <ChildPageFrame
      eyebrow="TODAY&apos;S MISSION / 今日任务"
      title="Help the animals!"
      description="Listen, find six new friends, and unlock the first trail in Animal Kingdom."
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
      <Link className="primary-action wide-action" href="/play/treasure-hunt">
        Begin the adventure
      </Link>
      <p className="mission-note">You can listen again whenever you need.</p>
    </ChildPageFrame>
  );
}
