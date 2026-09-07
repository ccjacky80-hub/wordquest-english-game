'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { GameShell } from '@/components/common/GameShell';
import { createProgressRepository } from '@/db/repositories/progress-repository';
import { createGameAttempt } from '@/games/game-attempt';
import type { GameAttempt } from '@/domain/learning/types';
import type { VocabularyEntry } from '@/content/schemas';

interface TreasureHuntGameProps {
  words: VocabularyEntry[];
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

export function TreasureHuntGame({ words }: TreasureHuntGameProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState<GameAttempt[]>([]);
  const [feedback, setFeedback] = useState('Listen, then find the animal.');
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repository = useMemo(() => createProgressRepository(), []);
  const round = createRound(words, roundIndex);

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
    void Promise.all(words.map((word) => repository.getWordProgress(word.id))).then((progressEntries) => {
      if (!cancelled && progressEntries.every((progress) => progress !== undefined)) {
        setSavedCount(progressEntries.length);
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
    const isCorrect = choice.id === round.target.id;
    const attempt = createGameAttempt({
      id: `${round.target.id}-${Date.now()}`,
      sessionId: 'day1-treasure-hunt',
      gameType: 'treasure-hunt',
      wordId: round.target.id,
      relatedWordIds: round.target.relatedWordIds,
      promptType: 'audio-to-object',
      outcome: isCorrect ? 'independentCorrect' : 'wrong',
      attemptIndex: 1,
      hintsUsed: 0,
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
      setFeedback('Try this one. Listen again.');
      playAudio();
      window.setTimeout(() => setLocked(false), 500);
    }
    void updatedProgress;
  };

  if (complete) {
    return (
      <section className="reward-card" aria-labelledby="reward-title">
        <p className="eyebrow">MISSION COMPLETE / 任务完成</p>
        <div className="reward-star" aria-hidden="true">✦</div>
        <h1 id="reward-title">The trail is brighter!</h1>
        <p>You helped {words.length} animals. Your progress is saved on this device.</p>
        <p className="reward-detail">{savedCount} attempts sent through the Learning Engine.</p>
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
      title="Treasure Hunt"
      attempts={attempts}
      isComplete={complete}
      onExit={() => { window.location.href = '/mission'; }}
    >
      <div className="treasure-prompt">
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
