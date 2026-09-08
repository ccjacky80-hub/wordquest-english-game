'use client';

import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import Link from 'next/link';
import { GameShell } from '@/components/common/GameShell';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { createGameAttempt } from '@/games/game-attempt';
import { getDailySessionId } from '@/content/progress-scheduler';
import type { GameAttempt } from '@/domain/learning/types';
import type { DragMission } from '@/content/drag-missions';

interface PutItSomewhereGameProps {
  missions: DragMission[];
  dayIndex: number;
}

function DraggableSource({ mission }: { mission: DragMission }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: mission.source.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <button
      ref={setNodeRef}
      className={`drag-source ${isDragging ? 'drag-source-active' : ''}`}
      style={style}
      type="button"
      data-word-id={mission.source.id}
      {...listeners}
      {...attributes}
    >
      {mission.source.imagePath && <img src={mission.source.imagePath} alt={mission.source.word} width={104} height={104} />}
      <span>{mission.source.word}</span>
    </button>
  );
}

function DropTarget({ mission, onPointerUp }: { mission: DragMission; onPointerUp: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: mission.targetWordId ?? mission.targetLabel });
  return (
    <div ref={setNodeRef} onPointerUp={onPointerUp} className={`drop-target ${isOver ? 'drop-target-over' : ''}`} data-target-label={mission.targetLabel}>
      {mission.targetImagePath && <img src={mission.targetImagePath} alt={mission.targetLabel} width={112} height={112} />}
      <span>{mission.targetLabel}</span>
    </div>
  );
}

function DistractorTarget({ onPointerUp }: { onPointerUp: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'wrong-target' });
  return (
    <div ref={setNodeRef} onPointerUp={onPointerUp} className={`drop-target drop-target-distractor ${isOver ? 'drop-target-over' : ''}`} data-target-label="another place">
      <span>another place</span>
    </div>
  );
}

export function PutItSomewhereGame({ missions, dayIndex }: PutItSomewhereGameProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState<GameAttempt[]>([]);
  const [feedback, setFeedback] = useState('Drag the word to the place that matches.');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);
  const handledDropRef = useRef(false);
  const activeIdRef = useRef<string | null>(null);
  const repository = useMemo(() => createProgressRepository(), []);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
  );
  const sessionId = getDailySessionId(dayIndex, 'put-it-somewhere');
  const mission = missions[roundIndex];

  const handleDrop = async (targetId: string) => {
    const expectedTarget = mission.targetWordId ?? mission.targetLabel;
    if (handledDropRef.current || locked || complete) return;
    handledDropRef.current = true;
    setActiveId(null);
    setLocked(true);
    const isCorrect = targetId === expectedTarget;
    const attempt = createGameAttempt({
      id: `put-it-somewhere-${mission.id}-${Date.now()}`,
      sessionId,
      gameType: 'put-it-somewhere',
      wordId: mission.source.id,
      relatedWordIds: mission.source.relatedWordIds,
      promptType: 'instruction-action',
      outcome: isCorrect ? 'independentCorrect' : 'wrong',
      attemptIndex: 1,
      hintsUsed: 0,
      audioReplayCount: 0,
      selectedAnswerId: targetId,
      occurredAt: new Date().toISOString(),
      contentVersion: mission.source.contentVersion,
    });
    setAttempts((current) => [...current, attempt]);
    void repository.recordAttempt(attempt);

    if (!isCorrect) {
      setFeedback('Nice try. Read the sentence again and try the other place.');
      window.setTimeout(() => { setLocked(false); handledDropRef.current = false; }, 500);
      return;
    }

    setFeedback('Great listening and placing!');
    window.setTimeout(() => {
      if (roundIndex + 1 >= missions.length) setComplete(true);
      else setRoundIndex((index) => index + 1);
      setLocked(false);
      handledDropRef.current = false;
    }, 650);
  };

  const handleDragEnd = ({ over }: DragEndEvent) => {
    if (over) void handleDrop(String(over.id));
  };

  if (complete) {
    return (
      <section className="reward-card" aria-labelledby="drag-reward-title">
        <p className="eyebrow">PUT IT SOMEWHERE COMPLETE / 拖拽完成</p>
        <div className="reward-star" aria-hidden="true">✦</div>
        <h1 id="drag-reward-title">You know where words belong!</h1>
        <p>You completed {missions.length} instruction moves. Your progress is saved on this device.</p>
        <div className="home-actions reward-actions">
          <Link className="primary-action" href="/map">See the map</Link>
          <Link className="secondary-action" href="/">Back home</Link>
        </div>
      </section>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => { activeIdRef.current = String(active.id); setActiveId(String(active.id)); }}
      onDragCancel={() => { activeIdRef.current = null; setActiveId(null); handledDropRef.current = false; }}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <GameShell
        currentStep={roundIndex}
        totalSteps={missions.length}
        title="Put It Somewhere"
        attempts={attempts}
        isComplete={complete}
        onExit={() => { window.location.href = '/mission'; }}
      >
        <div className="drag-instruction" data-mission-kind={mission.kind}>
          <p className="game-eyebrow">LISTEN &amp; MOVE</p>
          <h1>{mission.instruction}</h1>
          <p className="feedback-text" aria-live="polite">{feedback}</p>
        </div>
        <div className="drag-board">
          <DraggableSource mission={mission} />
          <DropTarget mission={mission} onPointerUp={() => { if (activeIdRef.current) void handleDrop(mission.targetWordId ?? mission.targetLabel); }} />
          <DistractorTarget onPointerUp={() => { if (activeIdRef.current) void handleDrop('wrong-target'); }} />
        </div>
      </GameShell>
      <DragOverlay>{activeId ? <div className="drag-overlay">{mission.source.word}</div> : null}</DragOverlay>
    </DndContext>
  );
}
