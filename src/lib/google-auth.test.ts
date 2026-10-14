import { describe, expect, it } from 'vitest';
import { googleAuthDestination } from './google-auth';
describe('configured Google provider boundary', () => {
  it('does not initiate OAuth without a configured provider', () => {
    expect(googleAuthDestination(undefined, '/app/calendar')).toBeNull(); expect(googleAuthDestination('', '/app/calendar')).toBeNull();
  });
  it('keeps a safe local return destination and permits local development', () => {
    const url = new URL(googleAuthDestination('https://api.example.com/oauth?scope=login', '/app/calendar?view=day#schedule')!); expect(url.searchParams.get('returnTo')).toBe('/app/calendar?view=day#schedule'); expect(url.searchParams.get('scope')).toBe('login');
    const local = new URL(googleAuthDestination('http://localhost:8000/oauth', 'https://evil.example')!); expect(local.searchParams.get('returnTo')).toBe('/app/overview');
  });
  it('rejects unsafe or malformed provider URLs', () => {
    for (const value of ['javascript:alert(1)', 'http://remote.example/oauth', 'https://owner:secret@api.example/oauth', 'not a url']) expect(googleAuthDestination(value, '/app/overview')).toBeNull();
  });
});
