'use client';

import Link from 'next/link';

export interface NextActivityTransitionProps {
  activityLabel: string;
  nextActivityLabel?: string;
  nextActivityHref?: string;
  completionMessage: string;
  detail: string;
  attempts?: number;
}

export function NextActivityTransition({
  activityLabel,
  nextActivityLabel,
  nextActivityHref,
  completionMessage,
  detail,
  attempts,
}: NextActivityTransitionProps) {
  const nextActivity = nextActivityLabel && nextActivityHref
    ? { label: nextActivityLabel, href: nextActivityHref }
    : undefined;
  return (
    <section className="reward-card next-activity-transition" aria-labelledby="next-activity-title">
      <p className="eyebrow">{activityLabel} COMPLETE / 练习完成</p>
      <div className="reward-star" aria-hidden="true">✦</div>
      <h1 id="next-activity-title">{completionMessage}</h1>
      <p>{detail}</p>
      {typeof attempts === 'number' ? <p className="reward-detail">{attempts} attempts sent through the Learning Engine.</p> : null}
      <div className="next-activity-callout" role="status">
        <strong>{nextActivity ? `Next: ${nextActivity.label}` : "Today's practice is complete!"}</strong>
        <span>{nextActivity ? 'Tap the button to keep going.' : 'You can replay any activity or return home.'}</span>
      </div>
      <div className="home-actions reward-actions">
        {nextActivity ? <Link className="primary-action" href={nextActivity.href}>Next: {nextActivity.label}</Link> : <Link className="primary-action" href="/mission?completed=1">See today&apos;s summary</Link>}
        <Link className="secondary-action" href={nextActivity ? '/mission' : '/mission?completed=1'}>{nextActivity ? 'View all activities' : 'Review today&apos;s summary'}</Link>
      </div>
    </section>
  );
}
