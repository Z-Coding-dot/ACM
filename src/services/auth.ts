import type { Api } from './contracts';
import type { Session } from '../types/domain';
import type { HttpClient } from './http';
import { ApiError } from './errors';
export function authService(client: HttpClient): Api['auth'] {
  async function write<T>(path: string, body?: unknown, method = 'POST'): Promise<T> { await client.csrf(); return client.request<T>(path, { method, body }); }
  function profile(value: Session): Session {
    if (!value?.user || typeof value.user.id !== 'string' || typeof value.user.emailVerified !== 'boolean' || !Array.isArray(value.businesses) || (value.activeBusinessId !== null && !value.businesses.some(b => b.id === value.activeBusinessId))) throw new ApiError('error.invalidResponse', 502);
    return value;
  }
  return {
    login: async (email, password, remember = false) => profile(await write<Session>('/auth/login', { email, password, remember })),
    signup: async (name, email, password, confirmation, locale = 'en') => profile(await write<Session>('/auth/signup', { name, email, password, password_confirmation: confirmation, locale })),
    forgotPassword: email => write<void>('/auth/forgot-password', { email }),
    resetPassword: (email, token, password, confirmation) => write<void>('/auth/reset-password', { email, token, password, password_confirmation: confirmation }),
    resendVerification: () => write<void>('/auth/verification-notification'),
    session: async () => profile(await client.request<Session>('/auth/session')),
    logout: () => write<void>('/auth/logout'),
    updateAccount: async (name, email, currentPassword) => profile(await write<Session>('/auth/account', { name, email, currentPassword }, 'PATCH')),
    selectBusiness: async id => profile(await write<Session>('/auth/workspace', { businessId: id })),
  };
}
