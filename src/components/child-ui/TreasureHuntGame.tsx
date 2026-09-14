'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameShell } from '@/components/common/GameShell';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { createGameAttempt } from '@/games/game-attempt';
import type { GameAttempt } from '@/domain/learning/types';
import type { VocabularyEntry } from '@/content/schemas';
import { getDailySessionId } from '@/content/progress-scheduler';
import { getAttemptProtectionState, outcomeAfterProtectedCorrect, shouldEnterSoftRetest } from '@/domain/learning/attempt-protection';
import { NextActivityTransition } from './NextActivityTransition';

interface TreasureHuntGameProps {
  words: VocabularyEntry[];
  dayIndex: number;
}

interface Round {
  target: VocabularyEntry;
  choices: VocabularyEntry[];
}

function createRound(words: VocabularyEntry[], index: number): Round {
  const target = words[index];
  const distractors = words.filter((word) => word.id !== target.id).slice(0, 3);
  return {
    target,
    choices: [target, ...distractors].sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export function TreasureHuntGame({ words, dayIndex }: TreasureHuntGameProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState<GameAttempt[]>([]);
  const [feedback, setFeedback] = useState('Listen, then find the animal.');
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repository = useMemo(() => createProgressRepository(), []);
  const sessionId = getDailySessionId(dayIndex, 'treasure-hunt');
  const round = createRound(words, roundIndex);
  const failedAttempts = attempts.filter((attempt) => attempt.wordId === round.target.id && attempt.outcome === 'wrong').length;
  const protection = getAttemptProtectionState(failedAttempts);

  const playAudio = useCallback(() => {
    if (!round.target.audioPath) return;
    audioRef.current?.pause();
    const audio = new Audio(round.target.audioPath);
    audioRef.current = audio;
    void audio.play().catch(() => setFeedback('Tap Listen again to hear the word.'));
  }, [round.target.audioPath]);

  useEffect(() => {
    playAudio();
    return () => {
      audioRef.current?.pause();
    };
  }, [playAudio]);

  useEffect(() => {
    let cancelled = false;
    void repository.getAttemptsBySession(sessionId).then((savedAttempts) => {
      const completedWordIds = new Set(
        savedAttempts.filter((attempt) => attempt.outcome !== 'wrong').map((attempt) => attempt.wordId),
      );
      if (!cancelled && completedWordIds.size === words.length) {
        setSavedCount(savedAttempts.length);
        setComplete(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repository, sessionId, words]);

  const handleChoice = async (choice: VocabularyEntry) => {
    if (locked || complete) return;
    setLocked(true);
    const isCorrect = choice.id === round.target.id;
    const attempt = createGameAttempt({
      id: `${round.target.id}-${Date.now()}`,
      sessionId,
      gameType: 'treasure-hunt',
      wordId: round.target.id,
      relatedWordIds: round.target.relatedWordIds,
      promptType: 'audio-to-object',
      outcome: isCorrect
        ? failedAttempts > 0
          ? outcomeAfterProtectedCorrect(failedAttempts)
          : 'independentCorrect'
        : failedAttempts + 1 >= 3 ? 'revealed' : 'wrong',
      attemptIndex: failedAttempts + 1,
      hintsUsed: protection.stage === 'hint' || protection.answerRevealed ? 1 : 0,
      audioReplayCount: 0,
      selectedAnswerId: choice.id,
      confusionWithWordId: isCorrect ? undefined : choice.id,
      occurredAt: new Date().toISOString(),
      contentVersion: round.target.contentVersion,
    });
    setAttempts((current) => [...current, attempt]);
    const updatedProgress = await repository.recordAttempt(attempt);
    setSavedCount((count) => count + 1);

    if (isCorrect) {
      setFeedback(`Great find! ${round.target.word} is here.`);
      window.setTimeout(() => {
        if (roundIndex + 1 >= words.length) {
          setComplete(true);
        } else {
          setRoundIndex((index) => index + 1);
        }
        setLocked(false);
      }, 650);
    } else {
      const nextProtection = getAttemptProtectionState(failedAttempts + 1);
      if (shouldEnterSoftRetest(failedAttempts + 1)) {
        setFeedback('We will revisit this animal in a few minutes. Let us keep exploring.');
        window.setTimeout(() => {
          if (roundIndex + 1 >= words.length) setComplete(true);
          else setRoundIndex((index) => index + 1);
          setLocked(false);
        }, 650);
      } else {
        setFeedback(nextProtection.stage === 'revealed'
          ? `Here is the answer: ${round.target.word}. We will revisit it soon.`
          : nextProtection.stage === 'hint'
            ? `A small clue: listen for ${round.target.word}.`
            : 'Try this one. Listen again.');
        playAudio();
        window.setTimeout(() => setLocked(false), 500);
      }
    }
    void updatedProgress;
  };

  if (complete) {
    return <NextActivityTransition
      activityLabel="Listen & find"
      nextActivityLabel="Look & match"
      nextActivityHref="/play/picture-match"
      completionMessage="The trail is brighter!"
      detail={`You helped ${words.length} animals. Your progress is saved on this device.`}
      attempts={savedCount}
    />;
  }

  return (
    <GameShell
      currentStep={roundIndex}
      totalSteps={words.length}
      title="Treasure Hunt"
      attempts={attempts}
      isComplete={complete}
      onExit={() => { window.location.href = '/mission'; }}
      sessionId={sessionId}
      gameType="treasure-hunt"
      activityIndex={1}
    >
      <div className="treasure-prompt" data-target-word-id={round.target.id}>
        <p className="game-eyebrow">LISTEN &amp; FIND</p>
        <h1>Find the animal!</h1>
        <button className="listen-button" type="button" onClick={playAudio}>
          🔊 Listen again
        </button>
        <p className="feedback-text" aria-live="polite">{feedback}</p>
      </div>
      <div className="treasure-choices" aria-label="Animal choices">
        {round.choices.map((choice) => (
          <button
            className="treasure-choice"
            data-word-id={choice.id}
            type="button"
            key={choice.id}
            onClick={() => void handleChoice(choice)}
            disabled={locked}
          >
            <img src={choice.imagePath} alt={choice.word} width={180} height={180} />
            <span>{choice.word}</span>
          </button>
        ))}
      </div>
    </GameShell>
  );
}
