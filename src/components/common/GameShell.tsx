'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { GameAttempt } from '@/domain/learning/types';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { createLocalEvent } from '@/content/local-telemetry';

interface GameShellProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  attempts: GameAttempt[];
  isComplete: boolean;
  onExit: () => void;
  children: ReactNode;
  sessionId: string;
  gameType: string;
  activityIndex: number;
}

export function GameShell({
  currentStep,
  totalSteps,
  title,
  attempts,
  isComplete,
  onExit,
  children,
  sessionId,
  gameType,
  activityIndex,
}: GameShellProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);
  const repository = useMemo(() => createProgressRepository(), []);
  const startedAt = useRef(new Date().toISOString());
  const lastCompletedRef = useRef(false);

  useEffect(() => {
    void repository.recordEvent(createLocalEvent('session_start', { sessionId, gameType }));
    void repository.recordEvent(createLocalEvent('game_start', { sessionId, gameType }));
    return () => {
      const type = lastCompletedRef.current ? 'session_end' : 'session_abandoned';
      void repository.recordEvent(createLocalEvent(type, { sessionId, gameType, startedAt: startedAt.current }));
      void repository.recordEvent(createLocalEvent('game_end', { sessionId, gameType, completed: lastCompletedRef.current }));
    };
  }, [gameType, repository, sessionId]);

  useEffect(() => {
    if (isComplete && !lastCompletedRef.current) {
      lastCompletedRef.current = true;
      void repository.recordEvent(createLocalEvent('reward_unlocked', { sessionId, gameType, attempts: attempts.length }));
    }
  }, [attempts.length, gameType, isComplete, repository, sessionId]);

  return (
    <main className="game-shell" aria-labelledby="game-title">
      <header className="game-header">
        <button className="exit-button" type="button" onClick={onExit}>
          Exit
        </button>
        <div className="game-progress-wrap">
          <p id="game-title" className="game-title">{title}</p>
          <p className="game-activity-progress">Activity {activityIndex} of 5 for today</p>
          <div className="game-progress-track" aria-label={`${currentStep} of ${totalSteps} complete`}>
            <div className="game-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="game-step" aria-live="polite">{currentStep}/{totalSteps}</span>
      </header>
      <section className="game-stage">
        {children}
      </section>
      <p className="game-attempt-note" aria-live="polite">
        {isComplete ? 'Mission complete!' : `${attempts.length} brave tries`}
      </p>
    </main>
  );
}
