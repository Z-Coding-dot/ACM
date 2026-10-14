import { authDestination } from './auth-destination';

export function googleAuthDestination(configuredUrl: string | undefined, returnTo: string, demo: boolean): string | null {
  if (demo || !configuredUrl) return null;
  try {
    const url = new URL(configuredUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password) return null;
    url.searchParams.set('returnTo', authDestination({ from: returnTo }));
    return url.href;
  } catch { return null; }
}
