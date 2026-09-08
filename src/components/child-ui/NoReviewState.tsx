import Link from 'next/link';

export function NoReviewState() {
  return (
    <main className="child-shell home-shell">
      <section className="child-page no-review-state">
        <p className="eyebrow">REVIEW QUEUE / 复习队列</p>
        <h1>No words are due right now.</h1>
        <p className="page-intro">Your next review will appear when its memory interval is ready. You can return to today&apos;s mission or explore the map.</p>
        <div className="home-actions">
          <Link className="primary-action" href="/mission">Back to mission</Link>
          <Link className="secondary-action" href="/map">See the map</Link>
        </div>
      </section>
    </main>
  );
}
