import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');

describe('PWA offline assets', () => {
  it('ships install metadata and maskable icons', () => {
    const manifest = JSON.parse(readFileSync(resolve(root, 'public/manifest.json'), 'utf8')) as { display: string; icons: Array<{ src: string; purpose?: string }> };
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((icon) => icon.src)).toContain('/icons/icon.svg');
    expect(manifest.icons.find((icon) => icon.purpose === 'maskable')?.src).toBe('/icons/icon-maskable.svg');
  });

  it('uses versioned cache-first fallback for offline documents and assets', () => {
    const sw = readFileSync(resolve(root, 'public/sw.js'), 'utf8');
    expect(sw).toContain("const CACHE_VERSION = 'wordquest-v1'");
    expect(sw).toContain("caches.match('/'));");
    expect(sw).toContain('self.skipWaiting()');
    expect(sw).toContain('self.clients.claim()');
  });
});
