import { describe, expect, it } from 'vitest';
import { shuffle } from '@/components/child-ui/WordBuilderGame';

describe('Word Builder shuffle', () => {
  it('returns a new array with the same items', () => {
    const input = ['l', 'i', 'o', 'n'];
    const output = shuffle(input);
    expect(output).not.toBe(input);
    expect([...output].sort()).toEqual([...input].sort());
  });

  it('produces more than one ordering across repeated calls', () => {
    const input = ['l', 'i', 'o', 'n', 'x', 'y'];
    const outputs = Array.from({ length: 24 }, () => shuffle(input).join(''));
    expect(new Set(outputs).size).toBeGreaterThan(1);
  });
});
