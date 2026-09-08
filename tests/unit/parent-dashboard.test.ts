import { describe, expect, it } from 'vitest';
import { buildParentDashboardSnapshot, gameLabel, masteryLabel } from '@/content/parent-dashboard';
import type { GameAttempt, WordProgress } from '@/domain/learning/types';

const progress = (wordId: string, level: WordProgress['masteryLevel']): WordProgress => ({ ...({ wordId, masteryLevel: level } as WordProgress), independentCorrectCount: 2, assistedCorrectCount: 1, wrongCount: 1, lastSeenAt: '2026-09-08T10:00:00.000Z' });
const attempt = (id: string, gameType: GameAttempt['gameType'], outcome: GameAttempt['outcome'], wordId = 'C0430'): GameAttempt => ({ id, gameType, outcome, wordId, sessionId: 'day1-picture-match', promptType: 'image-to-word', attemptIndex: 1, hintsUsed: 0, audioReplayCount: 0, occurredAt: `2026-09-08T10:0${id.length}:00.000Z`, contentVersion: 1 });

describe('parent dashboard snapshot', () => {
  it('aggregates real attempts and word progress without mutating input', () => {
    const attempts = [attempt('a', 'picture-match', 'independentCorrect'), attempt('b', 'picture-match', 'wrong'), attempt('c', 'word-builder', 'correctAfterHint')];
    const snapshot = buildParentDashboardSnapshot(attempts, [progress('C0430', 3)]);
    expect(snapshot.totalAttempts).toBe(3);
    expect(snapshot.totalCorrect).toBe(2);
    expect(snapshot.overallAccuracy).toBe(67);
    expect(snapshot.words[0].masteryLevel).toBe(3);
    expect(snapshot.gamePerformance.map((game) => game.gameType)).toEqual(['picture-match', 'word-builder']);
  });
  it('maps adult-facing labels', () => { expect(gameLabel('mini-story')).toContain('Boss'); expect(masteryLabel(5)).toBe('Mastered'); });
});
