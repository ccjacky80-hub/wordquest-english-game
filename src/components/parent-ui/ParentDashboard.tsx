'use client';

import { useEffect, useState } from 'react';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { buildParentDashboardSnapshot, gameLabel, masteryLabel, type ParentDashboardSnapshot } from '@/content/parent-dashboard';

function formatDate(value?: string): string { return value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'Not yet'; }

export function ParentDashboard() {
  const [snapshot, setSnapshot] = useState<ParentDashboardSnapshot>();
  useEffect(() => { let cancelled = false; const repo = createProgressRepository(); Promise.all([repo.getAllAttempts(), repo.getAllWordProgress()]).then(([attempts, progress]) => { if (!cancelled) setSnapshot(buildParentDashboardSnapshot(attempts, progress)); }); return () => { cancelled = true; }; }, []);
  if (!snapshot) return <main className="parent-shell"><p className="parent-muted">Loading learning data...</p></main>;
  return <main className="parent-shell">
    <header className="parent-header"><div><p className="parent-kicker">WORDQUEST / CAREGIVER VIEW</p><h1>Learning dashboard</h1><p className="parent-muted">A calm, evidence-based view of this week&apos;s practice.</p></div><a className="parent-child-link" href="/">Open child view</a></header>
    <section className="parent-overview" aria-label="Learning overview">
      <article className="parent-metric"><span>Course day</span><strong>{snapshot.dailyProgress.currentDayIndex}<small> / 7</small></strong><em>{snapshot.dailyProgress.courseCompleted ? 'Course complete' : 'Next mission ready'}</em></article>
      <article className="parent-metric"><span>Overall accuracy</span><strong>{snapshot.overallAccuracy}<small>%</small></strong><em>{snapshot.totalCorrect} correct / {snapshot.totalAttempts} attempts</em></article>
      <article className="parent-metric"><span>Words tracked</span><strong>{snapshot.words.length}</strong><em>Saved locally on this device</em></article>
    </section>
    <section className="parent-grid">
      <article className="parent-panel parent-wide"><div className="parent-panel-heading"><div><p className="parent-kicker">GAME PERFORMANCE</p><h2>Practice by activity</h2></div></div><div className="game-performance-list">{snapshot.gamePerformance.length ? snapshot.gamePerformance.map((game) => <div className="game-performance-row" key={game.gameType}><div><strong>{gameLabel(game.gameType)}</strong><span>{game.words} words · {game.attempts} attempts</span></div><b>{game.accuracy}%</b><div className="parent-bar"><i style={{ width: `${game.accuracy}%` }} /></div></div>) : <p className="parent-muted">No game attempts yet.</p>}</div></article>
      <article className="parent-panel"><p className="parent-kicker">RECENT ACTIVITY</p><h2>Latest practice</h2><ol className="activity-list">{snapshot.recentActivity.length ? snapshot.recentActivity.slice(0, 6).map((attempt) => <li key={attempt.id}><span className={`activity-dot ${attempt.outcome === 'wrong' ? 'is-wrong' : ''}`} /><div><strong>{gameLabel(attempt.gameType)}</strong><span>{attempt.outcome === 'wrong' ? 'Needs another try' : 'Correct response'} · {formatDate(attempt.occurredAt)}</span></div></li>) : <li className="parent-muted">No activity yet.</li>}</ol></article>
    </section>
    <section className="parent-panel"><div className="parent-panel-heading"><div><p className="parent-kicker">VOCABULARY MASTERY</p><h2>Words in progress</h2></div><span className="parent-table-note">Independent · assisted · wrong</span></div><div className="parent-table-wrap"><table className="parent-table"><thead><tr><th>Word</th><th>Mastery</th><th>Independent</th><th>Assisted</th><th>Wrong</th><th>Last seen</th></tr></thead><tbody>{snapshot.words.length ? snapshot.words.map((word) => <tr key={word.wordId}><td><strong>{word.word}</strong></td><td><span className={`mastery-pill mastery-${word.masteryLevel}`}>{masteryLabel(word.masteryLevel)}</span></td><td>{word.independentCorrectCount}</td><td>{word.assistedCorrectCount}</td><td>{word.wrongCount}</td><td>{formatDate(word.lastSeenAt)}</td></tr>) : <tr><td colSpan={6} className="parent-muted">Complete a game to see vocabulary evidence here.</td></tr>}</tbody></table></div></section>
  </main>;
}
