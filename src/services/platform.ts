import { http } from './http';
import type { Business, Industry, Locale, Page } from '../types/domain';

export interface PlatformBusiness { id: string; name: string; email: string; phone: string; industry: Industry; timeZone: string; currency: string; locale: Locale; suspended: boolean; members: number; createdAt: string }
export interface PlatformUser { id: string; name: string; email: string; emailVerified: boolean; platformAdmin: boolean; disabled: boolean; memberships: number; createdAt: string }
export interface Activity { id: string; actor: string | null; business: string | null; method: string; resource: string; recordId: string | null; createdAt: string }
export interface PlatformOverview { businesses: number; users: number; suspendedBusinesses: number; disabledUsers: number; appointments: number; customers: number; pageViews: number; activityCount: number; dailyViews: { day: string; views: number }[]; topPages: { path: string; views: number }[] }
export interface ContentEntry { key: string; draft: string; published: string | null; publishedAt: string | null }
export interface ContentIndex { data: ContentEntry[]; keys: string[] }
async function write<T>(path: string, method: string, body?: unknown): Promise<T> { await http.csrf(); return http.request<T>(path, { method, body }); }
export const platformApi = {
  overview: async () => (await http.request<{ data: PlatformOverview }>('/platform/overview')).data,
  businesses: (search: string, page: number) => http.request<Page<PlatformBusiness>>(`/platform/businesses?${new URLSearchParams({ search, page: String(page) })}`),
  users: (search: string, page: number) => http.request<Page<PlatformUser>>(`/platform/users?${new URLSearchParams({ search, page: String(page) })}`),
  saveBusiness: (body: Record<string, unknown>, id?: string) => write(`/platform/businesses${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PATCH' : 'POST', body),
  saveUser: (body: Record<string, unknown>, id?: string) => write<{ verificationEmailSent?: boolean }>(`/platform/users${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PATCH' : 'POST', body),
  remove: (kind: 'businesses' | 'users', id: string, confirmation: string) => write<void>(`/platform/${kind}/${encodeURIComponent(id)}`, 'DELETE', { confirmation }),
  activity: (page: number) => http.request<Page<Activity>>(`/platform/activity?page=${page}`),
  content: (locale: Locale) => http.request<ContentIndex>(`/platform/content?locale=${locale}`),
  saveContent: (locale: Locale, key: string, value: string, publish: boolean) => write<void>(`/platform/content/${encodeURIComponent(key)}`, 'PUT', { locale, value, publish }),
  resetContent: (locale: Locale, key: string) => write<void>(`/platform/content/${encodeURIComponent(key)}`, 'DELETE', { locale }),
};
export const brandingApi = {
  async upload(businessId: string, file: File): Promise<Business> { const body = new FormData(); body.append('logo', file); await http.csrf(); return (await http.request<{ data: Business }>('/business/logo', { method: 'POST', businessId, body })).data; },
  async remove(businessId: string): Promise<Business> { await http.csrf(); return (await http.request<{ data: Business }>('/business/logo', { method: 'DELETE', businessId })).data; },
};
