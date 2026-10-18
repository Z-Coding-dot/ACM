import { describe, expect, it } from 'vitest';
import { authDestination } from './auth-destination';
describe('safe authentication return routes', () => {
  it('keeps app details, queries and hashes', () => expect(authDestination({ from: '/app/settings?tab=business#account' })).toBe('/app/settings?tab=business#account'));
  it.each(['/platform', '/platform/content?locale=en', '/platform/users#search'])('keeps a platform destination %s without granting access', from => expect(authDestination({ from })).toBe(from));
  it.each(['https://outside.example/platform', '//outside.example/platform', '/platform/../login'])('rejects an unsafe platform destination %s', from => expect(authDestination({ from })).toBe('/app/overview'));
  it.each(['https://outside.example', '//outside.example', '/login', '/app/\\outside.example', '/app/../login'])('rejects unsafe return value %s', from => expect(authDestination({ from })).toBe('/app/overview'));
});
