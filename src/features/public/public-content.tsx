import { useEffect, useRef, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { http } from '../../services/http';
import { PublicContent } from './public-text';

export function PublicContentProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation(), location = useLocation(), visited = useRef<string | null>(null);
  const locale = i18n.language === 'fa-AF' ? 'fa-AF' : 'en';
  const query = useQuery({ queryKey: ['public-content', locale], queryFn: async () => (await http.request<{ data: Record<string, string> }>(`/public/content?locale=${locale}`)).data, staleTime: 0 });
  useEffect(() => {
    const titleKey = location.pathname === '/' ? 'landing.metaTitle' : 'public.title';
    const descriptionKey = location.pathname === '/' ? 'landing.metaDescription' : 'public.description';
    const title = `${query.data?.[titleKey] || i18n.t(titleKey)} · ${i18n.t('app.name')}`;
    const description = query.data?.[descriptionKey] || i18n.t(descriptionKey);
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  }, [query.data, location.pathname, locale, i18n]);
  useEffect(() => {
    if (!['/', '/about'].includes(location.pathname) || visited.current === location.pathname) return;
    visited.current = location.pathname;
    void (async () => { await http.csrf(); await http.request('/public/page-views', { method: 'POST', body: { path: location.pathname, locale } }); })().catch(() => { /* Analytics must never interrupt the public page. */ });
  }, [location.pathname, locale]);
  return <PublicContent.Provider value={query.data || {}}>{children}</PublicContent.Provider>;
}
