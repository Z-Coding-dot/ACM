export function authDestination(state: unknown): string {
  const from = state && typeof state === 'object' && 'from' in state ? state.from : null;
  const allowed = (path: string) => path.startsWith('/app/') || path === '/platform' || path.startsWith('/platform/');
  if (typeof from !== 'string' || !allowed(from.split(/[?#]/)[0]) || from.includes('\\')) return '/app/overview';
  const url = new URL(from, 'https://acm.invalid');
  return url.origin === 'https://acm.invalid' && allowed(url.pathname) ? `${url.pathname}${url.search}${url.hash}` : '/app/overview';
}
