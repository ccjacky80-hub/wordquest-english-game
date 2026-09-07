import Link from 'next/link';
import { getMvpEntries } from '@/content/loader';

export default function HomePage() {
  const featuredWords = getMvpEntries().slice(0, 3);

  return (
    <main className="child-shell home-shell">
      <section className="home-hero" aria-labelledby="page-title">
        <p className="eyebrow">WORDQUEST / 单词小世界</p>
        <p className="pet-badge" aria-label="Your guide is a friendly fox">
          ✦ Your fox guide
        </p>
        <h1 id="page-title">Ready for a word adventure?</h1>
        <p className="page-intro">
          Help the animals, listen closely, and make the world brighter one word at a time.
        </p>
        <div className="home-actions">
          <Link className="primary-action" href="/mission">
            Start today&apos;s mission
          </Link>
          <Link className="secondary-action" href="/map">
            Explore the map
          </Link>
        </div>
        <div className="home-world-card">
          <div>
            <p className="card-label">Your next world</p>
            <h2>Animal Kingdom</h2>
            <p>30 friendly words · listen, find, and play</p>
          </div>
          <div className="mini-word-row" aria-label="Featured animals">
            {featuredWords.map((entry) => (
              <img key={entry.id} src={entry.imagePath} alt={entry.word} width={72} height={72} />
            ))}
          </div>
        </div>
        <p className="status-note">Your learning progress stays on this device.</p>
      </section>
    </main>
  );
}
