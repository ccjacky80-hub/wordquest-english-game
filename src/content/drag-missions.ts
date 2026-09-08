import type { VocabularyEntry } from './schemas';

export type DragMissionKind = 'on' | 'to' | 'classification';

export interface DragMission {
  id: string;
  kind: DragMissionKind;
  instruction: string;
  source: VocabularyEntry;
  targetLabel: string;
  targetWordId?: string;
  targetImagePath?: string;
}

function findWord(words: VocabularyEntry[], value: string): VocabularyEntry | undefined {
  return words.find((word) => word.word === value);
}

export function createDragMissions(words: VocabularyEntry[]): DragMission[] {
  const feather = findWord(words, 'feather');
  const bird = findWord(words, 'bird');
  const horn = findWord(words, 'horn');
  const rhino = findWord(words, 'rhino');
  const fly = findWord(words, 'fly');
  const swim = findWord(words, 'swim');

  const missions: DragMission[] = [];
  if (feather && bird) {
    missions.push({
      id: 'feather-on-bird',
      kind: 'on',
      instruction: 'Put the feather on the bird.',
      source: feather,
      targetLabel: 'bird',
      targetWordId: bird.id,
      targetImagePath: bird.imagePath,
    });
  }
  if (horn && rhino) {
    missions.push({
      id: 'horn-to-rhino',
      kind: 'to',
      instruction: 'Give the horn to the rhino.',
      source: horn,
      targetLabel: 'rhino',
      targetWordId: rhino.id,
      targetImagePath: rhino.imagePath,
    });
  }
  if (fly) {
    missions.push({
      id: 'fly-to-sky',
      kind: 'classification',
      instruction: 'Which animal can fly? Move it to the sky.',
      source: fly,
      targetLabel: 'sky',
    });
  }
  if (swim) {
    missions.push({
      id: 'swim-to-water',
      kind: 'classification',
      instruction: 'Which animal can swim? Move it to the water.',
      source: swim,
      targetLabel: 'water',
    });
  }

  if (missions.length >= 3) return missions;
  const fallback = words.slice(0, Math.min(3, words.length));
  return fallback.map((source, index) => ({
    id: `fallback-${source.id}`,
    kind: index === 0 ? 'on' : index === 1 ? 'to' : 'classification',
    instruction: index === 0
      ? `Put the ${source.word} on the nest.`
      : index === 1
        ? `Give the ${source.word} to the friend.`
        : `Move the ${source.word} to the home.`,
    source,
    targetLabel: index === 0 ? 'nest' : index === 1 ? 'friend' : 'home',
  }));
}
