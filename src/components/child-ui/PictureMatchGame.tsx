'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GameShell } from '@/components/common/GameShell';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { createGameAttempt } from '@/games/game-attempt';
import type { GameAttempt } from '@/domain/learning/types';
import type { VocabularyEntry } from '@/content/schemas';

interface PictureMatchGameProps {
  words: VocabularyEntry[];
  optionCount?: 2 | 3 | 4;
}

interface PictureMatchRound {
  target: VocabularyEntry;
  choices: VocabularyEntry[];
}

function createRound(
  words: VocabularyEntry[],
  roundIndex: number,
  optionCount: number,
): PictureMatchRound {
  const target = words[roundIndex];
  const distractors = words
    .filter((word) => word.id !== target.id)
    .slice(roundIndex % Math.max(1, words.length - optionCount), roundIndex % Math.max(1, words.length - optionCount) + optionCount - 1);
  const choices = [target, ...distractors];
  return {
    target,
    choices: choices.sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export function PictureMatchGame({ words, optionCount = 4 }: PictureMatchGameProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundAttempts, setRoundAttempts] = useState(0);
  const [attempts, setAttempts] = useState<GameAttempt[]>([]);
  const [feedback, setFeedback] = useState('Look at the picture. Pick the word.');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [savedAttemptCount, setSavedAttemptCount] = useState(0);
  const repository = useMemo(() => createProgressRepository(), []);
  const round = createRound(words, roundIndex, optionCount);

  useEffect(() => {
    let cancelled = false;
    void repository.getAttemptsBySession('day1-picture-match').then((savedAttempts) => {
      const completedWordIds = new Set(
        savedAttempts
          .filter((attempt) => attempt.outcome !== 'wrong')
          .map((attempt) => attempt.wordId),
      );
      if (!cancelled && completedWordIds.size === words.length) {
        setSavedAttemptCount(savedAttempts.length);
        setComplete(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repository, words]);

  const handleChoice = async (choice: VocabularyEntry) => {
    if (locked || complete) return;
    setLocked(true);
    setSelectedId(choice.id);
    const isCorrect = choice.id === round.target.id;
    const attemptNumber = roundAttempts + 1;
    const attempt = createGameAttempt({
      id: `picture-match-${round.target.id}-${Date.now()}`,
      sessionId: 'day1-picture-match',
      gameType: 'picture-match',
      wordId: round.target.id,
      relatedWordIds: round.target.relatedWordIds,
      promptType: 'image-to-word',
      outcome: isCorrect
        ? roundAttempts > 0
          ? 'correctAfterHint'
          : 'independentCorrect'
        : 'wrong',
      attemptIndex: attemptNumber,
      hintsUsed: roundAttempts > 0 ? 1 : 0,
      audioReplayCount: 0,
      selectedAnswerId: choice.id,
      confusionWithWordId: isCorrect ? undefined : choice.id,
      occurredAt: new Date().toISOString(),
      contentVersion: round.target.contentVersion,
    });
    setAttempts((current) => [...current, attempt]);
    await repository.recordAttempt(attempt);
    setSavedAttemptCount((count) => count + 1);

    if (!isCorrect) {
      setRoundAttempts(attemptNumber);
      setFeedback(
        attemptNumber >= 2
          ? `Here is a clue: look for ${round.target.word}. Try again!`
          : 'Not this one. Look closely and try again.',
      );
      window.setTimeout(() => setLocked(false), 450);
      return;
    }

    setFeedback(
      roundAttempts > 0
        ? `You found it with a clue: ${round.target.word}!`
        : `Great match! That word is ${round.target.word}.`,
    );
    window.setTimeout(() => {
      if (roundIndex + 1 >= words.length) {
        setComplete(true);
      } else {
        setRoundIndex((index) => index + 1);
        setRoundAttempts(0);
        setSelectedId(undefined);
      }
      setLocked(false);
    }, 650);
  };

  if (complete) {
    return (
      <section className="reward-card" aria-labelledby="picture-reward-title">
        <p className="eyebrow">PICTURE MATCH COMPLETE / 看图选词完成</p>
        <div className="reward-star" aria-hidden="true">✦</div>
        <h1 id="picture-reward-title">Your word eyes are brighter!</h1>
        <p>You matched {words.length} pictures with their words. Your progress is saved on this device.</p>
        <p className="reward-detail">{savedAttemptCount} attempts sent through the Learning Engine.</p>
        <div className="home-actions reward-actions">
          <Link className="primary-action" href="/map">See the map</Link>
          <Link className="secondary-action" href="/">Back home</Link>
        </div>
      </section>
    );
  }

  return (
    <GameShell
      currentStep={roundIndex}
      totalSteps={words.length}
      title="Picture Match"
      attempts={attempts}
      isComplete={complete}
      onExit={() => { window.location.href = '/mission'; }}
    >
      <div className="picture-match-prompt">
        <p className="game-eyebrow">LOOK &amp; MATCH</p>
        <h1>Which word is it?</h1>
        <img
          className="picture-match-target"
          data-word-id={round.target.id}
          src={round.target.imagePath}
          alt="Picture to match"
          width={240}
          height={240}
        />
        <p className="feedback-text" aria-live="polite">{feedback}</p>
      </div>
      <div className="picture-match-choices" aria-label="Written word choices">
        {round.choices.map((choice) => {
          const isTarget = choice.id === round.target.id;
          const isSelected = choice.id === selectedId;
          return (
            <button
              className={`picture-match-choice ${isSelected ? 'picture-choice-selected' : ''} ${
                isSelected && !isTarget ? 'picture-choice-wrong' : ''
              } ${isTarget && roundAttempts >= 2 ? 'picture-choice-hint' : ''}`}
              data-word-id={choice.id}
              type="button"
              key={choice.id}
              onClick={() => void handleChoice(choice)}
              disabled={locked}
            >
              <span>{choice.word}</span>
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
