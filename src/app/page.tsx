export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">WORDQUEST / 单词小世界</p>
        <h1 id="page-title">A little world for big word adventures.</h1>
        <p className="intro">
          The local-first playground is ready for its first vocabulary mission.
        </p>
        <div className="mission-card">
          <div>
            <p className="card-label">Next mission</p>
            <h2>Animal Kingdom</h2>
            <p>30 words · listen, find, build, and play</p>
          </div>
          <button type="button" className="play-button" aria-label="Start the next mission">
            Play
          </button>
        </div>
        <p className="status-note">Your progress will stay on this device.</p>
      </section>
    </main>
  );
}
