export function authDestination(state: unknown): string {
  const from = state && typeof state === 'object' && 'from' in state ? state.from : null;
  if (typeof from !== 'string' || !from.startsWith('/app/') || from.includes('\\')) return '/app/overview';
  const url = new URL(from, 'https://acm.invalid');
  return url.origin === 'https://acm.invalid' && url.pathname.startsWith('/app/') ? `${url.pathname}${url.search}${url.hash}` : '/app/overview';
}
