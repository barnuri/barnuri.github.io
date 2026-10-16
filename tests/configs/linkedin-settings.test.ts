import { describe, expect, test } from 'bun:test';
import { LinkedInSettings } from '../../src/configs/linkedin-settings.ts';
import { DEFAULT_API_VERSION } from '../../src/consts/linkedin-api.ts';

describe('LinkedInSettings.fromEnv', () => {
  test('reads all values and keeps secrets out of JSON', () => {
    const settings = LinkedInSettings.fromEnv({
      LINKEDIN_ACCESS_TOKEN: 'token-value',
      LINKEDIN_CLIENT_ID: 'client',
      LINKEDIN_CLIENT_SECRET: 'secret-value',
      LINKEDIN_API_VERSION: '202610',
    });

    expect(settings.accessToken()).toBe('token-value');
    expect(settings.hasClientCredentials).toBe(true);
    expect(settings.apiVersion).toBe('202610');
    expect(JSON.stringify(settings)).not.toContain('token-value');
    expect(JSON.stringify(settings)).not.toContain('secret-value');
  });

  test('treats blank values as missing', () => {
    const settings = LinkedInSettings.fromEnv({ LINKEDIN_ACCESS_TOKEN: '  ', LINKEDIN_CLIENT_ID: '' });

    expect(settings.hasAccessToken).toBe(false);
    expect(settings.hasClientCredentials).toBe(false);
    expect(settings.apiVersion).toBe(DEFAULT_API_VERSION);
  });

  test('rejects an API version that is not YYYYMM', () => {
    expect(() => LinkedInSettings.fromEnv({ LINKEDIN_API_VERSION: '2026-10' })).toThrow('YYYYMM');
  });
});
