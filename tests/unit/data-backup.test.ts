import { describe, expect, it } from 'vitest';
import { createDataBackup, parseDataBackup } from '@/content/data-backup';

describe('parent data backup schema', () => {
  it('round-trips attempts and word progress with schema version 1', () => {
    const backup = createDataBackup([], []);
    expect(parseDataBackup(backup)).toMatchObject({ schemaVersion: 1, attempts: [], wordProgress: [] });
  });

  it('rejects unsupported or malformed backups', () => {
    expect(() => parseDataBackup({ schemaVersion: 2, attempts: [], wordProgress: [] })).toThrow();
    expect(() => parseDataBackup({ schemaVersion: 1, attempts: 'nope', wordProgress: [] })).toThrow();
  });
});
