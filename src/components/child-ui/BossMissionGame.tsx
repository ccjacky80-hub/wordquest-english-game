'use client';

import { useMemo, useRef, useState } from 'react';
import { DndContext, DragOverlay, closestCenter, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import Link from 'next/link';
import { GameShell } from '@/components/common/GameShell';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { createGameAttempt } from '@/games/game-attempt';
import { getDailySessionId } from '@/content/progress-scheduler';
import type { GameAttempt } from '@/domain/learning/types';
import type { BossStep } from '@/content/boss-mission';
import { getAttemptProtectionState, outcomeAfterProtectedCorrect, shouldEnterSoftRetest } from '@/domain/learning/attempt-protection';

interface BossMissionGameProps { steps: BossStep[]; dayIndex: number; }

function Source({ step, onClick }: { step: BossStep; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: step.source.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return <button ref={setNodeRef} style={style} className={`drag-source ${isDragging ? 'drag-source-active' : ''}`} data-word-id={step.source.id} type="button" onClick={onClick} {...listeners} {...attributes}>
    {step.source.imagePath && <img src={step.source.imagePath} alt={step.source.word} width={128} height={128} />}
    <span>{step.source.word}</span>
  </button>;
}

function Target({ step, onPointerUp }: { step: BossStep; onPointerUp: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: step.targetWordId ?? step.targetLabel });
  return <div ref={setNodeRef} onPointerUp={onPointerUp} className={`drop-target ${isOver ? 'drop-target-over' : ''}`} data-target-label={step.targetLabel}>
    <span>{step.targetLabel}</span>
  </div>;
}

export function BossMissionGame({ steps, dayIndex }: BossMissionGameProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [attempts, setAttempts] = useState<GameAttempt[]>([]);
  const [feedback, setFeedback] = useState('A story adventure is waiting.');
  const [complete, setComplete] = useState(false);
  const [locked, setLocked] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const handledRef = useRef(false);
  const activeRef = useRef<string | null>(null);
  const repository = useMemo(() => createProgressRepository(), []);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 4 } }), useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }));
  const sessionId = getDailySessionId(dayIndex, 'boss-mission');
  const step = steps[stepIndex];
  const failedAttempts = attempts.filter((attempt) => attempt.wordId === step.source.id && attempt.outcome === 'wrong').length;
  const protection = getAttemptProtectionState(failedAttempts);

  const resolveStep = (targetId: string) => {
    if (handledRef.current || locked || complete) return;
    handledRef.current = true;
    const expected = step.targetWordId ?? step.targetLabel;
    const correct = targetId === expected;
    const attempt = createGameAttempt({ id: `boss-${step.id}-${Date.now()}`, sessionId, gameType: 'mini-story', wordId: step.source.id, relatedWordIds: step.source.relatedWordIds, promptType: step.kind === 'find' ? 'image-to-word' : 'instruction-action', outcome: correct ? failedAttempts > 0 ? outcomeAfterProtectedCorrect(failedAttempts) : 'independentCorrect' : failedAttempts + 1 >= 3 ? 'revealed' : 'wrong', attemptIndex: failedAttempts + 1, hintsUsed: protection.stage === 'hint' || protection.answerRevealed ? 1 : 0, audioReplayCount: 0, selectedAnswerId: targetId, occurredAt: new Date().toISOString(), contentVersion: step.source.contentVersion });
    setAttempts((current) => [...current, attempt]);
    void repository.recordAttempt(attempt);
    if (!correct) {
      const nextProtection = getAttemptProtectionState(failedAttempts + 1);
      setFeedback(shouldEnterSoftRetest(failedAttempts + 1)
        ? 'We will revisit this story step in a few minutes.'
        : nextProtection.stage === 'revealed'
          ? `Here is the answer: ${step.targetLabel}. We will revisit it soon.`
          : nextProtection.stage === 'hint' ? 'A small clue: listen to the story again.' : 'Nice try. Listen to the story and try again.');
      window.setTimeout(() => {
        if (shouldEnterSoftRetest(failedAttempts + 1)) {
          if (stepIndex + 1 >= steps.length) setComplete(true);
          else setStepIndex((index) => index + 1);
        }
        setLocked(false);
        handledRef.current = false;
      }, 500);
      return;
    }
    setLocked(true);
    setFeedback('That fits the story!');
    window.setTimeout(() => { if (stepIndex + 1 >= steps.length) setComplete(true); else setStepIndex((index) => index + 1); setLocked(false); handledRef.current = false; }, 650);
  };

  const onDragEnd = ({ over }: DragEndEvent) => { if (over) resolveStep(String(over.id)); activeRef.current = null; setActiveId(null); };
  if (complete) return <section className="reward-card" aria-labelledby="boss-reward-title"><p className="eyebrow">BOSS MISSION COMPLETE / 故事关卡完成</p><div className="reward-star" aria-hidden="true">✦</div><h1 id="boss-reward-title">The Animal Kingdom story shines!</h1><p>You connected {steps.length} words in one story. Your progress is saved.</p><div className="home-actions reward-actions"><Link className="primary-action" href="/map">See the map</Link><Link className="secondary-action" href="/">Back home</Link></div></section>;

  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => { activeRef.current = String(active.id); setActiveId(String(active.id)); }} onDragCancel={() => { activeRef.current = null; setActiveId(null); handledRef.current = false; }} onDragEnd={onDragEnd}>
    <GameShell currentStep={stepIndex} totalSteps={steps.length} title="Boss Mission" attempts={attempts} isComplete={complete} onExit={() => { window.location.href = '/mission'; }}>
      <div className="drag-instruction" data-boss-step={step.id}><p className="game-eyebrow">MINI STORY · STEP {stepIndex + 1}</p><h1>{step.instruction}</h1><p className="feedback-text" aria-live="polite">{feedback}</p></div>
      <div className="drag-board"><Source step={step} onClick={step.kind === 'find' ? () => resolveStep(step.source.id) : undefined} /><Target step={step} onPointerUp={() => { if (activeRef.current) resolveStep(step.targetWordId ?? step.targetLabel); }} /></div>
    </GameShell>
    <DragOverlay>{activeId ? <div className="drag-overlay">{step.source.word}</div> : null}</DragOverlay>
  </DndContext>;
}
