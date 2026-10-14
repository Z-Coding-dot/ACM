import type { Api } from './contracts';
import type { Session } from '../types/domain';
import type { HttpClient } from './http';
export function authService(client: HttpClient): Api['auth'] {
  return {
    login: (email, password, remember = false) => client.request<Session>('/auth/login', { method: 'POST', body: { email, password, remember } }),
    signup: (name, email, password) => client.request<void>('/auth/signup', { method: 'POST', body: { name, email, password } }),
    forgotPassword: email => client.request<void>('/auth/forgot-password', { method: 'POST', body: { email } }),
    session: () => client.request<Session>('/auth/session'),
    logout: () => client.request<void>('/auth/logout', { method: 'POST' }),
    updateAccount: (name, email) => client.request<void>('/auth/account', { method: 'PATCH', body: { name, email } }),
  };
}
