'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ParentGateProps {
  children: ReactNode;
}

const HOLD_DURATION_MS = 2000;

export function ParentGate({ children }: ParentGateProps) {
  const [heldMs, setHeldMs] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const holdStartedAt = useRef<number | undefined>(undefined);
  const timerRef = useRef<number | undefined>(undefined);

  const cancelHold = () => {
    setIsHolding(false);
    holdStartedAt.current = undefined;
    if (timerRef.current !== undefined) window.clearInterval(timerRef.current);
    timerRef.current = undefined;
  };

  const startHold = () => {
    if (confirmed) return;
    holdStartedAt.current = Date.now();
    setHeldMs(0);
    setIsHolding(true);
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - (holdStartedAt.current ?? Date.now());
      setHeldMs(Math.min(elapsed, HOLD_DURATION_MS));
      if (elapsed >= HOLD_DURATION_MS) {
        cancelHold();
        setShowConfirm(true);
      }
    }, 40);
  };

  useEffect(() => () => cancelHold(), []);

  if (confirmed) return <>{children}</>;

  const progress = Math.round((heldMs / HOLD_DURATION_MS) * 100);
  return (
    <main className="parent-gate-shell">
      <section className="parent-gate-card" aria-labelledby="parent-gate-title">
        <p className="parent-kicker">WORDQUEST / CAREGIVER VIEW</p>
        <h1 id="parent-gate-title">Grown-up check</h1>
        <p className="parent-gate-copy">Press and hold the button for 2 seconds to open the learning dashboard.</p>
        <button
          className={`parent-gate-hold ${isHolding ? 'is-holding' : ''}`}
          type="button"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
          aria-describedby="parent-gate-status"
        >
          <span className="parent-gate-progress" style={{ width: `${progress}%` }} />
          <span>{isHolding ? 'Keep holding…' : 'Hold to continue'}</span>
        </button>
        <p id="parent-gate-status" className="parent-gate-status" aria-live="polite">
          {isHolding ? `${Math.ceil((HOLD_DURATION_MS - heldMs) / 1000)} seconds left` : 'This check resets every time.'}
        </p>
      </section>
      {showConfirm ? (
        <div className="parent-gate-dialog-backdrop" role="presentation">
          <section className="parent-gate-dialog" role="alertdialog" aria-modal="true" aria-labelledby="parent-confirm-title">
            <p className="parent-kicker">QUICK CONFIRMATION</p>
            <h2 id="parent-confirm-title">Open the caregiver dashboard?</h2>
            <p>This area shows learning records and game performance.</p>
            <div className="parent-gate-actions">
              <button className="parent-gate-confirm" type="button" onClick={() => setConfirmed(true)}>Yes, open dashboard</button>
              <button className="parent-gate-cancel" type="button" onClick={() => setShowConfirm(false)}>Not now</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
