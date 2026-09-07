import Link from 'next/link';
import { ChildPageFrame } from '@/components/child-ui/ChildPageFrame';
import { getMvpEntries } from '@/content/loader';

export default function MapPage() {
  const mvpWords = getMvpEntries();

  return (
    <ChildPageFrame
      eyebrow="WORLD MAP / 世界地图"
      title="Animal Kingdom"
      description="Six stepping stones are ready. Each one helps a new animal join your adventure."
      backHref="/"
      backLabel="Home"
    >
      <div className="map-progress" aria-label="Animal Kingdom progress">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: '12%' }} />
        </div>
        <span>0 of 6 steps complete</span>
      </div>
      <div className="map-board">
        {mvpWords.slice(0, 6).map((entry, index) => (
          <Link
            className={`map-node ${index === 0 ? 'map-node-active' : ''}`}
            href={index === 0 ? '/mission' : '/map'}
            key={entry.id}
            aria-label={index === 0 ? `Start with ${entry.word}` : `${entry.word} locked`}
          >
            <span className="map-node-number">{index + 1}</span>
            <img src={entry.imagePath} alt="" width={112} height={112} />
            <strong>{index === 0 ? 'Start here' : 'Coming soon'}</strong>
            <span>{entry.word}</span>
          </Link>
        ))}
      </div>
      <div className="map-callout">
        <span className="callout-icon" aria-hidden="true">✦</span>
        <p>Finish today&apos;s mission to brighten the first path.</p>
      </div>
    </ChildPageFrame>
  );
}
