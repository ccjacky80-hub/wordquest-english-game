import type { GameAttempt, LocalEvent, WordProgress } from '@/domain/learning/types';

export const LOCAL_EVENT_TYPES = [
  'session_start', 'session_end', 'game_start', 'game_end', 'attempt',
  'hint_used', 'audio_replayed', 'word_state_changed', 'reward_unlocked', 'session_abandoned',
] as const;

export type LocalEventType = (typeof LOCAL_EVENT_TYPES)[number];

export function createLocalEvent(type: LocalEventType, payload: Record<string, unknown> = {}, occurredAt = new Date().toISOString()): LocalEvent {
  return { id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, payload, occurredAt };
}

export function eventsForAttempt(attempt: GameAttempt, updatedProgress?: WordProgress): LocalEvent[] {
  const events = [createLocalEvent('attempt', { attemptId: attempt.id, sessionId: attempt.sessionId, gameType: attempt.gameType, wordId: attempt.wordId, outcome: attempt.outcome })];
  if (attempt.hintsUsed > 0) events.push(createLocalEvent('hint_used', { attemptId: attempt.id, count: attempt.hintsUsed, gameType: attempt.gameType }));
  if (attempt.audioReplayCount > 0) events.push(createLocalEvent('audio_replayed', { attemptId: attempt.id, count: attempt.audioReplayCount, gameType: attempt.gameType }));
  if (updatedProgress) events.push(createLocalEvent('word_state_changed', { wordId: updatedProgress.wordId, fromAttemptId: attempt.id, masteryLevel: updatedProgress.masteryLevel, nextReviewAt: updatedProgress.nextReviewAt }));
  return events;
}

export function recentLocalEvents(events: readonly LocalEvent[], now: string): LocalEvent[] {
  const cutoff = Date.parse(now) - 7 * 86_400_000;
  return events.filter((event) => Date.parse(event.occurredAt) >= cutoff);
}

export function summarizeLocalEvents(events: readonly LocalEvent[]): Record<LocalEventType, number> {
  const summary = Object.fromEntries(LOCAL_EVENT_TYPES.map((type) => [type, 0])) as Record<LocalEventType, number>;
  for (const event of events) if (LOCAL_EVENT_TYPES.includes(event.type as LocalEventType)) summary[event.type as LocalEventType] += 1;
  return summary;
}
