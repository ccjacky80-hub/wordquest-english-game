import contentData from '../../data/vocabulary.clean.json';
import { vocabularyContentSchema, type VocabularyEntry } from './schemas';

const vocabularyContent = vocabularyContentSchema.parse(contentData);

export interface VocabularyQuery {
  world?: string;
  mvpOnly?: boolean;
  mvpRank?: number;
  mvpRankRange?: { min?: number; max?: number };
}

export function getVocabularyEntries(query: VocabularyQuery = {}): VocabularyEntry[] {
  return vocabularyContent.entries.filter((entry) => {
    if (query.world !== undefined && entry.world !== query.world) return false;
    if (query.mvpOnly === true && entry.mvp?.enabled !== true) return false;
    if (query.mvpRank !== undefined && entry.mvp?.rank !== query.mvpRank) return false;
    if (query.mvpRankRange !== undefined) {
      const rank = entry.mvp?.rank;
      if (rank === undefined) return false;
      if (query.mvpRankRange.min !== undefined && rank < query.mvpRankRange.min) return false;
      if (query.mvpRankRange.max !== undefined && rank > query.mvpRankRange.max) return false;
    }
    return true;
  });
}

export function getMvpEntries(): VocabularyEntry[] {
  return getVocabularyEntries({ mvpOnly: true }).sort(
    (left, right) => (left.mvp?.rank ?? Number.MAX_SAFE_INTEGER) - (right.mvp?.rank ?? Number.MAX_SAFE_INTEGER),
  );
}

export function getVocabularyEntry(wordId: string): VocabularyEntry | undefined {
  return vocabularyContent.entries.find((entry) => entry.id === wordId);
}

export function getVocabularyContentVersion(): number {
  return vocabularyContent.contentVersion;
}
