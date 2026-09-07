'use client';

import type { ReactNode } from 'react';
import type { GameAttempt } from '@/domain/learning/types';

interface GameShellProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  attempts: GameAttempt[];
  isComplete: boolean;
  onExit: () => void;
  children: ReactNode;
}

export function GameShell({
  currentStep,
  totalSteps,
  title,
  attempts,
  isComplete,
  onExit,
  children,
}: GameShellProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <main className="game-shell" aria-labelledby="game-title">
      <header className="game-header">
        <button className="exit-button" type="button" onClick={onExit}>
          Exit
        </button>
        <div className="game-progress-wrap">
          <p id="game-title" className="game-title">{title}</p>
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
