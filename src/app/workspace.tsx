import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services';
import type { Business, Session, Locale } from '../types/domain';
import { industries } from '../config/industries';
import i18n from '../i18n';
import { SESSION_EXPIRED_EVENT } from '../services/http';
import { ApiError } from '../services/errors';

interface AuthContextValue {
  session: Session | null; loading: boolean; switching: boolean; login: (email: string, password: string, remember?: boolean, returnTo?: string) => Promise<void>;
  signup: (name: string, email: string, password: string, confirmation: string, returnTo?: string) => Promise<void>;
  refreshSession: () => Promise<Session>; resetPassword: (email: string, token: string, password: string, confirmation: string) => Promise<void>;
  logout: () => Promise<void>; switchBusiness: (id: string) => Promise<void>; updateBusiness: (b: Business) => void;
  updateUser: (name: string, email: string) => void;
  bootError: unknown; expired: boolean; retrySession: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [bootError, setBootError] = useState<unknown>(null), [expired, setExpired] = useState(false), [attempt, setAttempt] = useState(0);
  const queryClient = useQueryClient(); const epoch = useRef(0);
  useEffect(() => {
    let active = true; const revision = epoch.current; setLoading(true); setBootError(null);
    api.auth.session().then(s => { if (active && revision === epoch.current) { setSession(s); const locale = s.businesses.find(b => b.id === s.activeBusinessId)?.locale || s.user.locale; if (locale) void i18n.changeLanguage(locale); } }).catch(error => { if (active && !(error instanceof ApiError && [401, 419].includes(error.status))) setBootError(error); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => {
    const invalidate = () => { epoch.current++; setSession(null); setExpired(true); void queryClient.cancelQueries(); queryClient.clear(); };
    window.addEventListener(SESSION_EXPIRED_EVENT, invalidate);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, invalidate);
  }, [queryClient]);
  const value: AuthContextValue = {
    session, loading, switching, bootError, expired, retrySession: () => setAttempt(n => n + 1),
    async login(email, password, remember = false, returnTo) { const s = await api.auth.login(email, password, remember, returnTo); queryClient.clear(); setBootError(null); setExpired(false); setSession(s); const b = s.businesses.find(b => b.id === s.activeBusinessId); if (b?.locale || s.user.locale) await i18n.changeLanguage(b?.locale || s.user.locale!); },
    async signup(name, email, password, confirmation, returnTo) { const s = await api.auth.signup(name, email, password, confirmation, i18n.language === 'fa-AF' ? 'fa-AF' : 'en', returnTo); queryClient.clear(); setSession(s); setBootError(null); setExpired(false); },
    async refreshSession() { const revision = epoch.current; let s: Session; try { s = await api.auth.session(); } catch (error) { if (revision === epoch.current && error instanceof ApiError && [401, 419].includes(error.status)) { epoch.current++; await queryClient.cancelQueries(); queryClient.clear(); setSession(null); setExpired(true); } throw error; } if (revision !== epoch.current) throw new ApiError('error.sessionExpired', 401); await queryClient.cancelQueries(); if (revision !== epoch.current) throw new ApiError('error.sessionExpired', 401); queryClient.clear(); setSession(s); setBootError(null); return s; },
    async resetPassword(email, token, password, confirmation) { await api.auth.resetPassword(email, token, password, confirmation); await queryClient.cancelQueries(); queryClient.clear(); setSession(null); },
    async logout() { epoch.current++; await api.auth.logout(); await queryClient.cancelQueries(); queryClient.clear(); setSession(null); },
    async switchBusiness(id) {
      if (!session?.businesses.some(b => b.id === id) || session.activeBusinessId === id || switching) return;
      setSwitching(true);
      const revision = epoch.current;
      try { const s = await api.auth.selectBusiness(id); if (revision !== epoch.current) throw new ApiError('error.sessionExpired', 401); await queryClient.cancelQueries(); queryClient.clear(); await i18n.changeLanguage(s.businesses.find(b => b.id === id)!.locale); if (revision !== epoch.current) throw new ApiError('error.sessionExpired', 401); setSession(s); }
      finally { setSwitching(false); }
    },
    updateBusiness(b) { setSession(s => s && ({ ...s, businesses: s.businesses.map(old => old.id === b.id ? b : old) })); },
    updateUser(name, email) { setSession(s => s && ({ ...s, user: { ...s.user, name, email } })); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider required'); return value; }
export function useWorkspace() {
  const auth = useAuth();
  const business = auth.session?.businesses.find(b => b.id === auth.session!.activeBusinessId);
  if (!business) throw new Error('Active business required');
  return { ...auth, business, can: (permission: string) => business.permissions?.includes(permission) === true, industry: industries[business.industry], locale: i18n.language as Locale };
}
