'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GameShell } from '@/components/common/GameShell';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { createGameAttempt } from '@/games/game-attempt';
import { getDailySessionId } from '@/content/progress-scheduler';
import { getAttemptProtectionState, outcomeAfterProtectedCorrect, shouldEnterSoftRetest } from '@/domain/learning/attempt-protection';
import type { GameAttempt } from '@/domain/learning/types';
import type { VocabularyEntry } from '@/content/schemas';

export type BuilderLevel = 'L1' | 'L2' | 'L3';

interface WordBuilderGameProps {
  words: VocabularyEntry[];
  dayIndex: number;
  defaultLevel?: BuilderLevel;
}

interface LetterToken {
  id: string;
  letter: string;
}

interface WordBuilderRound {
  target: VocabularyEntry;
  normalizedWord: string;
  missingIndexes: number[];
  tokens: LetterToken[];
}

const LEVEL_DESCRIPTIONS: Record<BuilderLevel, string> = {
  L1: 'Fill 1–2 missing letters.',
  L2: 'Put every letter in order.',
  L3: 'Listen, then build the whole word.',
};

function normalizeWord(word: string): string {
  return word.replace(/[^a-z]/gi, '').toLowerCase();
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createRound(words: VocabularyEntry[], roundIndex: number, level: BuilderLevel): WordBuilderRound {
  const target = words[roundIndex];
  const normalizedWord = normalizeWord(target.word);
  const missingCount = normalizedWord.length >= 5 ? 2 : 1;
  const missingIndexes = level === 'L1'
    ? Array.from({ length: missingCount }, (_, index) => Math.max(0, normalizedWord.length - missingCount + index))
    : [];
  const letters = level === 'L1'
    ? [...new Set(missingIndexes.map((index) => normalizedWord[index]).concat(['a', 'e', 'i', 'o', 'u']))]
        .slice(0, missingCount + 4)
    : shuffle([...normalizedWord]);

  return {
    target,
    normalizedWord,
    missingIndexes,
    tokens: letters.map((letter, index) => ({ id: `${target.id}-${level}-${index}`, letter })),
  };
}

function displayWord(round: WordBuilderRound, level: BuilderLevel, selectedTokens: LetterToken[]): string {
  if (level === 'L1') {
    let selectedIndex = 0;
    return [...round.normalizedWord].map((letter, index) => {
      if (!round.missingIndexes.includes(index)) return letter;
      const selected = selectedTokens[selectedIndex]?.letter;
      selectedIndex += 1;
      return selected ?? '_';
    }).join('');
  }

  if (level === 'L3') {
    return selectedTokens.map((token) => token.letter).join('') + '_'.repeat(round.normalizedWord.length - selectedTokens.length);
  }

  return selectedTokens.map((token) => token.letter).join('') + '_'.repeat(round.normalizedWord.length - selectedTokens.length);
}

export function WordBuilderGame({ words, dayIndex, defaultLevel = 'L1' }: WordBuilderGameProps) {
  const [level, setLevel] = useState<BuilderLevel>(defaultLevel);
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState<LetterToken[]>([]);
  const [attempts, setAttempts] = useState<GameAttempt[]>([]);
  const [feedback, setFeedback] = useState('Build the word. Pick a letter.');
  const [bouncing, setBouncing] = useState(false);
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [savedAttemptCount, setSavedAttemptCount] = useState(0);
  const [audioReplayCount, setAudioReplayCount] = useState(0);
  const repository = useMemo(() => createProgressRepository(), []);
  const sessionId = getDailySessionId(dayIndex, 'word-builder');
  const round = createRound(words, roundIndex, level);
  const shownWord = displayWord(round, level, selectedTokens);
  const failedAttempts = attempts.filter((attempt) => attempt.wordId === round.target.id && attempt.outcome === 'wrong').length;
  const protection = getAttemptProtectionState(failedAttempts);

  const playAudio = () => {
    if (level !== 'L3' || !round.target.audioPath) return;
    const audio = new Audio(round.target.audioPath);
    void audio.play().catch(() => setFeedback('Tap Listen again to hear the word.'));
    setAudioReplayCount((count) => count + 1);
  };

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

  useEffect(() => {
    if (level === 'L3') playAudio();
    return () => undefined;
  }, [level, roundIndex]);

  const changeLevel = (nextLevel: BuilderLevel) => {
    if (nextLevel === level || locked) return;
    setLevel(nextLevel);
    setRoundIndex(0);
    setSelectedTokens([]);
    setFeedback(LEVEL_DESCRIPTIONS[nextLevel]);
    setAudioReplayCount(0);
  };

  const chooseLetter = (token: LetterToken) => {
    if (locked || complete || selectedTokens.some((selected) => selected.id === token.id)) return;
    const nextTokens = [...selectedTokens, token];
    setSelectedTokens(nextTokens);
    const requiredCount = level === 'L1' ? round.missingIndexes.length : round.normalizedWord.length;
    if (nextTokens.length < requiredCount) return;

    setLocked(true);
    const actual = nextTokens.map((selected) => selected.letter).join('');
    const expected = level === 'L1'
      ? round.missingIndexes.map((index) => round.normalizedWord[index]).join('')
      : round.normalizedWord;
    const isCorrect = actual === expected;
    const attempt = createGameAttempt({
      id: `word-builder-${round.target.id}-${level}-${Date.now()}`,
      sessionId,
      gameType: 'word-builder',
      wordId: round.target.id,
      relatedWordIds: round.target.relatedWordIds,
      promptType: 'word-build',
      outcome: isCorrect
        ? failedAttempts > 0
          ? outcomeAfterProtectedCorrect(failedAttempts)
          : 'independentCorrect'
        : failedAttempts + 1 >= 3 ? 'revealed' : 'wrong',
      attemptIndex: failedAttempts + 1,
      hintsUsed: protection.stage === 'hint' || protection.answerRevealed ? 1 : 0,
      audioReplayCount,
      selectedAnswerId: round.target.id,
      occurredAt: new Date().toISOString(),
      contentVersion: round.target.contentVersion,
    });
    setAttempts((current) => [...current, attempt]);
    void repository.recordAttempt(attempt).then(() => setSavedAttemptCount((count) => count + 1));

    if (!isCorrect) {
      const nextProtection = getAttemptProtectionState(failedAttempts + 1);
      setFeedback(shouldEnterSoftRetest(failedAttempts + 1)
        ? 'We will revisit this word in a few minutes. Let us keep going.'
        : nextProtection.stage === 'revealed'
          ? `Here is the answer: ${round.target.word}. We will revisit it soon.`
          : level === 'L3' ? 'Listen once more and try again.' : 'Almost! Let the letters bounce, then try again.');
      setBouncing(true);
      window.setTimeout(() => {
        setBouncing(false);
        setSelectedTokens([]);
        setLocked(false);
        if (shouldEnterSoftRetest(failedAttempts + 1)) {
          if (roundIndex + 1 >= words.length) setComplete(true);
          else setRoundIndex((index) => index + 1);
        }
        if (level === 'L3') playAudio();
      }, 550);
      return;
    }

    setFeedback(`Great build! The word is ${round.target.word}.`);
    window.setTimeout(() => {
      if (roundIndex + 1 >= words.length) {
        setComplete(true);
      } else {
        setRoundIndex((index) => index + 1);
        setSelectedTokens([]);
        setAudioReplayCount(0);
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
      sessionId={sessionId}
      gameType="word-builder"
      activityIndex={3}
    >
      <div className="word-builder-levels" aria-label="Word Builder level">
        {(Object.keys(LEVEL_DESCRIPTIONS) as BuilderLevel[]).map((option) => (
          <button
            className={option === level ? 'level-button level-button-active' : 'level-button'}
            type="button"
            key={option}
            onClick={() => changeLevel(option)}
            aria-pressed={option === level}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="word-builder-prompt" data-target-word-id={round.target.id} data-level={level}>
        <p className="game-eyebrow">BUILD THE WORD · {level}</p>
        <h1 className={bouncing ? 'letters-bouncing' : ''} aria-live="polite">{shownWord}</h1>
        <p className="feedback-text" aria-live="polite">{feedback}</p>
      </div>
      {level === 'L3' && (
        <button className="listen-button word-builder-listen" type="button" onClick={playAudio}>
          Listen again
        </button>
      )}
      <div className="letter-bank" aria-label="Letter choices">
        {round.tokens.map((token) => (
          <button
            key={token.id}
            className="letter-tile"
            data-letter={token.letter}
            data-token-id={token.id}
            type="button"
            onClick={() => chooseLetter(token)}
            disabled={locked || selectedTokens.some((selected) => selected.id === token.id)}
          >
            {token.letter}
          </button>
        ))}
      </div>
      <p className="word-builder-hint">{LEVEL_DESCRIPTIONS[level]}</p>
    </GameShell>
  );
}
