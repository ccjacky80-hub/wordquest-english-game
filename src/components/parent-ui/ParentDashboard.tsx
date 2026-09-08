'use client';

import { useEffect, useState } from 'react';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { buildParentDashboardSnapshot, gameLabel, masteryLabel, type ParentDashboardSnapshot } from '@/content/parent-dashboard';
import { getVocabularyEntry } from '@/content/loader';
import { type ParentVocabularyGroup } from '@/content/parent-vocabulary';
import { createDataBackup, parseDataBackup } from '@/content/data-backup';

function formatDate(value?: string): string { return value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'Not yet'; }

export function ParentDashboard() {
  const [snapshot, setSnapshot] = useState<ParentDashboardSnapshot>();
  const [dataMessage, setDataMessage] = useState<string>();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPhrase, setResetPhrase] = useState('');
  const repository = createProgressRepository();

  const refresh = async () => {
    const [attempts, progress] = await Promise.all([repository.getAllAttempts(), repository.getAllWordProgress()]);
    setSnapshot(buildParentDashboardSnapshot(attempts, progress));
  };

  const exportData = async () => {
    const [attempts, progress] = await Promise.all([repository.getAllAttempts(), repository.getAllWordProgress()]);
    const blob = new Blob([JSON.stringify(createDataBackup(attempts, progress), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordquest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDataMessage('Backup downloaded.');
  };

  const importData = async (file: File) => {
    try {
      const payload = parseDataBackup(JSON.parse(await file.text()));
      await repository.importData(payload);
      await refresh();
      setDataMessage(`Imported ${payload.attempts.length} attempts and ${payload.wordProgress.length} word records.`);
    } catch {
      setDataMessage('Import rejected: choose a valid WordQuest backup JSON.');
    }
  };

  const resetData = async () => {
    if (resetPhrase !== 'RESET') return;
    await repository.resetLearningData();
    setResetOpen(false);
    setResetPhrase('');
    await refresh();
    setDataMessage('Learning data reset. App settings were kept.');
  };
  useEffect(() => { let cancelled = false; const repo = createProgressRepository(); Promise.all([repo.getAllAttempts(), repo.getAllWordProgress()]).then(([attempts, progress]) => { if (!cancelled) setSnapshot(buildParentDashboardSnapshot(attempts, progress)); }); return () => { cancelled = true; }; }, []);
  if (!snapshot) return <main className="parent-shell"><p className="parent-muted">Loading learning data...</p></main>;
  return <main className="parent-shell">
    <header className="parent-header"><div><p className="parent-kicker">WORDQUEST / CAREGIVER VIEW</p><h1>Learning dashboard</h1><p className="parent-muted">A calm, evidence-based view of this week&apos;s practice.</p></div><div className="parent-header-actions"><button className="parent-child-link" type="button" onClick={() => void exportData()}>Export data</button><label className="parent-child-link" htmlFor="backup-import">Import data<input id="backup-import" className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importData(file); event.currentTarget.value = ''; }} /></label><button className="parent-child-link parent-reset-link" type="button" onClick={() => setResetOpen(true)}>Reset data</button><a className="parent-child-link" href="/">Open child view</a></div></header>
    {dataMessage ? <p className="parent-data-message" role="status">{dataMessage}</p> : null}
    <section className="parent-overview" aria-label="Learning overview">
      <article className="parent-metric"><span>Course day</span><strong>{snapshot.dailyProgress.currentDayIndex}<small> / 7</small></strong><em>{snapshot.dailyProgress.courseCompleted ? 'Course complete' : 'Next mission ready'}</em></article>
      <article className="parent-metric"><span>Overall accuracy</span><strong>{snapshot.overallAccuracy}<small>%</small></strong><em>{snapshot.totalCorrect} correct / {snapshot.totalAttempts} attempts</em></article>
      <article className="parent-metric"><span>Words tracked</span><strong>{snapshot.words.length}</strong><em>Saved locally on this device</em></article>
    </section>
    <section className="parent-grid">
      <article className="parent-panel parent-wide"><div className="parent-panel-heading"><div><p className="parent-kicker">GAME PERFORMANCE</p><h2>Practice by activity</h2></div></div><div className="game-performance-list">{snapshot.gamePerformance.length ? snapshot.gamePerformance.map((game) => <div className="game-performance-row" key={game.gameType}><div><strong>{gameLabel(game.gameType)}</strong><span>{game.words} words · {game.attempts} attempts</span></div><b>{game.accuracy}%</b><div className="parent-bar"><i style={{ width: `${game.accuracy}%` }} /></div></div>) : <p className="parent-muted">No game attempts yet.</p>}</div></article>
      <article className="parent-panel"><p className="parent-kicker">RECENT ACTIVITY</p><h2>Latest practice</h2><ol className="activity-list">{snapshot.recentActivity.length ? snapshot.recentActivity.slice(0, 6).map((attempt) => <li key={attempt.id}><span className={`activity-dot ${attempt.outcome === 'wrong' ? 'is-wrong' : ''}`} /><div><strong>{gameLabel(attempt.gameType)}</strong><span>{attempt.outcome === 'wrong' ? 'Needs another try' : 'Correct response'} · {formatDate(attempt.occurredAt)}</span></div></li>) : <li className="parent-muted">No activity yet.</li>}</ol></article>
    </section>
    <section className="parent-panel"><div className="parent-panel-heading"><div><p className="parent-kicker">VOCABULARY STATUS</p><h2>Words by learning stage</h2></div><span className="parent-table-note">PRD 5-group view</span></div><div className="vocabulary-group-tabs">{(['New', 'Learning', 'Review Due', 'Strong', 'Mastered'] as ParentVocabularyGroup[]).map((group) => <div className="vocabulary-group" key={group}><strong>{group}</strong><b>{snapshot.vocabularyGroups[group].length}</b></div>)}</div><div className="parent-table-wrap"><table className="parent-table"><thead><tr><th>Word</th><th>Group</th><th>Mastery</th><th>Independent</th><th>Assisted</th><th>Wrong</th><th>Last seen</th></tr></thead><tbody>{snapshot.words.length ? snapshot.words.map((word) => { const group = (Object.keys(snapshot.vocabularyGroups) as ParentVocabularyGroup[]).find((key) => snapshot.vocabularyGroups[key].some((entry) => entry.wordId === word.wordId)) ?? 'Learning'; return <tr key={word.wordId}><td><strong>{word.word}</strong></td><td><span className="mastery-pill">{group}</span></td><td><span className={`mastery-pill mastery-${word.masteryLevel}`}>{masteryLabel(word.masteryLevel)}</span></td><td>{word.independentCorrectCount}</td><td>{word.assistedCorrectCount}</td><td>{word.wrongCount}</td><td>{formatDate(word.lastSeenAt)}</td></tr>; }) : <tr><td colSpan={7} className="parent-muted">Complete a game to see vocabulary evidence here.</td></tr>}</tbody></table></div></section>
    <section className="parent-panel problem-panel"><div className="parent-panel-heading"><div><p className="parent-kicker">PROBLEM WORDS</p><h2>Needs a little more attention</h2></div><span className="parent-table-note">Last 7 days</span></div>{snapshot.problemWords.length ? <ul className="confusion-list">{snapshot.problemWords.slice(0, 8).map((problem) => <li key={`${problem.wordId}-${problem.reason}`}><strong>{getVocabularyEntry(problem.wordId)?.word ?? problem.wordId}</strong><span>{problem.reason === 'consecutive-wrong' ? `${problem.consecutiveWrong} consecutive errors` : 'Accuracy declining over 7 days'} · {formatDate(problem.lastOccurredAt)}</span></li>)}</ul> : <p className="parent-muted">No problem words detected in the last 7 days.</p>}</section>
    <section className="parent-panel confusion-panel"><div className="parent-panel-heading"><div><p className="parent-kicker">CONFUSION WATCH</p><h2>Recently mixed up</h2></div><span className="parent-table-note">Repeated wrong selections</span></div>{snapshot.confusionPairs.length ? <ul className="confusion-list">{snapshot.confusionPairs.slice(0, 5).map((pair) => <li key={pair.pairKey}><strong>{getVocabularyEntry(pair.wordAId)?.word ?? pair.wordAId} <span>↔</span> {getVocabularyEntry(pair.wordBId)?.word ?? pair.wordBId}</strong><span>{pair.count} mix-ups · last seen {formatDate(pair.lastOccurredAt)}</span></li>)}</ul> : <p className="parent-muted">No repeated mix-ups yet.</p>}</section>
    {resetOpen ? <div className="parent-gate-dialog-backdrop" role="presentation"><section className="parent-gate-dialog" role="alertdialog" aria-modal="true" aria-labelledby="reset-title"><p className="parent-kicker">DESTRUCTIVE ACTION</p><h2 id="reset-title">Reset all learning data?</h2><p>This removes attempts, mastery, review queue, confusion pairs, sessions, and rewards from this device. Export a backup first if needed.</p><p>To confirm, type <strong>RESET</strong>.</p><input className="reset-phrase-input" value={resetPhrase} onChange={(event) => setResetPhrase(event.target.value)} aria-label="Type RESET to confirm" /><div className="parent-gate-actions"><button className="parent-gate-confirm parent-reset-confirm" type="button" disabled={resetPhrase !== 'RESET'} onClick={() => void resetData()}>Reset learning data</button><button className="parent-gate-cancel" type="button" onClick={() => { setResetOpen(false); setResetPhrase(''); }}>Cancel</button></div></section></div> : null}
  </main>;
}
