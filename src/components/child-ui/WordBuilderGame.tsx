'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GameShell } from '@/components/common/GameShell';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { createGameAttempt } from '@/games/game-attempt';
import { getDailySessionId } from '@/content/progress-scheduler';
import type { GameAttempt } from '@/domain/learning/types';
import type { VocabularyEntry } from '@/content/schemas';

interface WordBuilderGameProps {
  words: VocabularyEntry[];
  dayIndex: number;
}

interface WordBuilderRound {
  target: VocabularyEntry;
  missingIndexes: number[];
  letters: string[];
}

function createRound(words: VocabularyEntry[], roundIndex: number): WordBuilderRound {
  const target = words[roundIndex];
  const normalizedWord = target.word.replace(/[^a-z]/gi, '').toLowerCase();
  const missingCount = normalizedWord.length >= 5 ? 2 : 1;
  const missingIndexes = Array.from({ length: missingCount }, (_, index) =>
    Math.max(0, normalizedWord.length - missingCount + index),
  );
  const missingLetters = missingIndexes.map((index) => normalizedWord[index]);
  const letters = [...missingLetters, ...['a', 'e', 'i', 'o', 'u']]
    .filter((letter, index, all) => all.indexOf(letter) === index)
    .slice(0, missingCount + 4);
  return { target, missingIndexes, letters };
}

function maskWord(word: string, missingIndexes: number[], selectedLetters: string[]): string {
  const normalized = word.replace(/[^a-z]/gi, '').toLowerCase();
  let selectedIndex = 0;
  return [...normalized]
    .map((letter, index) => {
      if (!missingIndexes.includes(index)) return letter;
      const selected = selectedLetters[selectedIndex];
      selectedIndex += 1;
      return selected ?? '_';
    })
    .join('');
}

export function WordBuilderGame({ words, dayIndex }: WordBuilderGameProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<GameAttempt[]>([]);
  const [feedback, setFeedback] = useState('Build the word. Pick a letter.');
  const [bouncing, setBouncing] = useState(false);
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [savedAttemptCount, setSavedAttemptCount] = useState(0);
  const repository = useMemo(() => createProgressRepository(), []);
  const sessionId = getDailySessionId(dayIndex, 'word-builder');
  const round = createRound(words, roundIndex);
  const maskedWord = maskWord(round.target.word, round.missingIndexes, selectedLetters);

  useEffect(() => {
    let cancelled = false;
    void repository.getAttemptsBySession(sessionId).then((savedAttempts) => {
      const completedWordIds = new Set(
        savedAttempts.filter((attempt) => attempt.outcome !== 'wrong').map((attempt) => attempt.wordId),
      );
      if (!cancelled && completedWordIds.size === words.length) {
        setSavedAttemptCount(savedAttempts.length);
        setComplete(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repository, sessionId, words]);

  const chooseLetter = (letter: string) => {
    if (locked || selectedLetters.length >= round.missingIndexes.length) return;
    const nextLetters = [...selectedLetters, letter];
    setSelectedLetters(nextLetters);
    if (nextLetters.length < round.missingIndexes.length) return;

    setLocked(true);
    const expected = round.missingIndexes.map((index) => round.target.word[index].toLowerCase()).join('');
    const actual = nextLetters.join('');
    const isCorrect = actual === expected;
    const attempt = createGameAttempt({
      id: `word-builder-${round.target.id}-${Date.now()}`,
      sessionId,
      gameType: 'word-builder',
      wordId: round.target.id,
      relatedWordIds: round.target.relatedWordIds,
      promptType: 'word-build',
      outcome: isCorrect ? 'independentCorrect' : 'wrong',
      attemptIndex: 1,
      hintsUsed: 0,
      audioReplayCount: 0,
      selectedAnswerId: round.target.id,
      occurredAt: new Date().toISOString(),
      contentVersion: round.target.contentVersion,
    });
    setAttempts((current) => [...current, attempt]);
    void repository.recordAttempt(attempt).then(() => setSavedAttemptCount((count) => count + 1));

    if (!isCorrect) {
      setFeedback('Almost! Let the letters bounce, then try again.');
      setBouncing(true);
      window.setTimeout(() => {
        setBouncing(false);
        setSelectedLetters([]);
        setLocked(false);
      }, 550);
      return;
    }

    setFeedback(`Great build! The word is ${round.target.word}.`);
    window.setTimeout(() => {
      if (roundIndex + 1 >= words.length) {
        setComplete(true);
      } else {
        setRoundIndex((index) => index + 1);
        setSelectedLetters([]);
      }
      setLocked(false);
    }, 650);
  };

  if (complete) {
    return (
      <section className="reward-card" aria-labelledby="builder-reward-title">
        <p className="eyebrow">WORD BUILDER COMPLETE / 拼词完成</p>
        <div className="reward-star" aria-hidden="true">✦</div>
        <h1 id="builder-reward-title">Your word trail grows!</h1>
        <p>You built {words.length} words. Your progress is saved on this device.</p>
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
      title="Word Builder"
      attempts={attempts}
      isComplete={complete}
      onExit={() => { window.location.href = '/mission'; }}
    >
      <div className="word-builder-prompt" data-target-word-id={round.target.id}>
        <p className="game-eyebrow">BUILD THE WORD · L1</p>
        <h1 className={bouncing ? 'letters-bouncing' : ''} aria-live="polite">{maskedWord}</h1>
        <p className="feedback-text" aria-live="polite">{feedback}</p>
      </div>
      <div className="letter-bank" aria-label="Letter choices">
        {round.letters.map((letter) => (
          <button
            key={letter}
            className="letter-tile"
            data-letter={letter}
            type="button"
            onClick={() => chooseLetter(letter)}
            disabled={locked || selectedLetters.includes(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
      <p className="word-builder-hint">Fill the missing letters. No rush.</p>
    </GameShell>
  );
}
