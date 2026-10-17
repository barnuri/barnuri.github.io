import { describe, expect, test } from 'bun:test';
import { LinkedInMediaDownloader } from '../../../src/services/linkedin/media-downloader.ts';

describe('LinkedInMediaDownloader.isLinkedInUrl', () => {
  test('accepts only https URLs on LinkedIn CDN hosts', () => {
    expect(LinkedInMediaDownloader.isLinkedInUrl('https://media.licdn.com/dms/image/v2/a')).toBe(true);
    expect(LinkedInMediaDownloader.isLinkedInUrl('https://dms.licdn.com/playlist/vid/v2/a')).toBe(true);
    expect(LinkedInMediaDownloader.isLinkedInUrl('http://media.licdn.com/a')).toBe(false);
    expect(LinkedInMediaDownloader.isLinkedInUrl('https://licdn.com.evil.example/a')).toBe(false);
    expect(LinkedInMediaDownloader.isLinkedInUrl('not a url')).toBe(false);
  });
});
