import { describe, expect, it } from 'vitest';
import { getProblemWords, groupVocabulary, parentVocabularyGroup } from '@/content/parent-vocabulary';
import type { GameAttempt, WordProgress } from '@/domain/learning/types';

const word = (wordId: string, masteryLevel: WordProgress['masteryLevel'], extra: Partial<WordProgress> = {}): WordProgress => ({ wordId, masteryLevel, listeningRecognition: 0, visualRecognition: 0, spelling: 0, activeRecall: 0, contextUse: 0, memoryStrength: 0, currentReviewStage: 0, independentCorrectCount: 0, assistedCorrectCount: 0, wrongCount: 0, activeRecallCorrectCount: 0, independentCorrectDates: [], attemptCount: 0, lastQuality: 0, version: 1, ...extra });
const attempt = (id: string, wordId: string, outcome: GameAttempt['outcome'], occurredAt: string): GameAttempt => ({ id, wordId, outcome, gameType: 'picture-match', sessionId: 's', promptType: 'image-to-word', attemptIndex: 1, hintsUsed: 0, audioReplayCount: 0, selectedAnswerId: undefined, occurredAt, contentVersion: 1 });

describe('parent vocabulary groups', () => {
  it('maps progress to the five PRD groups', () => {
    const now = '2026-09-08T10:00:00.000Z';
    expect(parentVocabularyGroup(word('new', 0), now)).toBe('New');
    expect(parentVocabularyGroup(word('learning', 2, { attemptCount: 1 }), now)).toBe('Learning');
    expect(parentVocabularyGroup(word('due', 2, { attemptCount: 1, nextReviewAt: '2026-09-08T09:00:00.000Z' }), now)).toBe('Review Due');
    expect(parentVocabularyGroup(word('strong', 4, { attemptCount: 2, lastQuality: 1, nextReviewAt: '2026-09-09T09:00:00.000Z' }), now)).toBe('Strong');
    expect(parentVocabularyGroup(word('mastered', 5), now)).toBe('Mastered');
    expect(Object.keys(groupVocabulary([word('new', 0), word('mastered', 5)], now))).toEqual(['New', 'Learning', 'Review Due', 'Strong', 'Mastered']);
  });

  it('detects consecutive errors and seven-day decline', () => {
    const now = '2026-09-08T10:00:00.000Z';
    const attempts = [
      attempt('a1', 'errors', 'wrong', '2026-09-08T09:00:00.000Z'),
      attempt('a2', 'errors', 'revealed', '2026-09-07T09:00:00.000Z'),
      attempt('b1', 'decline', 'wrong', '2026-09-08T09:00:00.000Z'),
      attempt('b2', 'decline', 'correctAfterHint', '2026-09-06T09:00:00.000Z'),
      attempt('b3', 'decline', 'independentCorrect', '2026-09-01T11:00:00.000Z'),
    ];
    const problems = getProblemWords([word('errors', 2), word('decline', 2)], attempts, now);
    expect(problems.map((problem) => problem.reason)).toEqual(['consecutive-wrong', 'declining-7d']);
  });
});
