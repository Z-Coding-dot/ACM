import { authDestination } from './auth-destination';
import type { Locale } from '../types/domain';

export function googleAuthDestination(configuredUrl: string | undefined, returnTo: string, locale: Locale = 'en'): string | null {
  if (!configuredUrl) return null;
  try {
    const url = new URL(configuredUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password) return null;
    url.searchParams.set('returnTo', authDestination({ from: returnTo }));
    url.searchParams.set('locale', locale);
    return url.href;
  } catch { return null; }
}
