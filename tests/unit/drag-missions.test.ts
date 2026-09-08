import { describe, expect, it } from 'vitest';
import { createDragMissions } from '@/content/drag-missions';
import { getMvpEntries } from '@/content/loader';

describe('G4 drag mission generator', () => {
  it('creates the three extensible relationship kinds from matching content', () => {
    const words = getMvpEntries();
    const missions = createDragMissions(words);
    expect(missions.length).toBeGreaterThanOrEqual(3);
    expect(new Set(missions.map((mission) => mission.kind))).toEqual(
      new Set(['on', 'to', 'classification']),
    );
    expect(missions.map((mission) => mission.instruction)).toContain('Put the feather on the bird.');
    expect(missions.map((mission) => mission.instruction)).toContain('Give the horn to the rhino.');
  });

  it('falls back to natural short instructions for an incomplete day list', () => {
    const missions = createDragMissions(getMvpEntries().slice(0, 6));
    expect(missions).toHaveLength(3);
    expect(missions.every((mission) => mission.instruction.length > 0)).toBe(true);
  });
});
