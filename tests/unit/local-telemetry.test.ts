import { describe, expect, it } from 'vitest';
import { createLocalEvent, eventsForAttempt, summarizeLocalEvents } from '@/content/local-telemetry';
import type { GameAttempt } from '@/domain/learning/types';

describe('local telemetry', () => {
  it('allows only the declared local event types in summaries', () => {
    const summary = summarizeLocalEvents([createLocalEvent('session_start'), createLocalEvent('game_start'), { id: 'x', type: 'external_analytics', payload: {}, occurredAt: '' }]);
    expect(summary.session_start).toBe(1);
    expect(summary.game_start).toBe(1);
    expect(Object.keys(summary)).not.toContain('external_analytics');
  });

  it('derives attempt, hint, audio and word state events locally', () => {
    const attempt = { id: 'a', sessionId: 's', gameType: 'picture-match', wordId: 'w', promptType: 'image-to-word', outcome: 'correctAfterHint', attemptIndex: 2, hintsUsed: 1, audioReplayCount: 2, occurredAt: '2026-09-08T10:00:00.000Z', contentVersion: 1 } as GameAttempt;
    const events = eventsForAttempt(attempt, { wordId: 'w', masteryLevel: 2, nextReviewAt: '2026-09-08T10:10:00.000Z' } as never);
    expect(events.map((event) => event.type)).toEqual(['attempt', 'hint_used', 'audio_replayed', 'word_state_changed']);
  });
});
