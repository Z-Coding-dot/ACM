import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services';
import type { Business, Session, Locale } from '../types/domain';
import { industries } from '../config/industries';
import i18n from '../i18n';

interface AuthContextValue {
  session: Session | null; loading: boolean; login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>; switchBusiness: (id: string) => void; updateBusiness: (b: Business) => void;
  updateUser: (name: string, email: string) => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  useEffect(() => { let active = true; api.auth.session().then(s => { if (active) setSession(s); }).catch(() => {}).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const value: AuthContextValue = {
    session, loading,
    async login(email, password) { const s = await api.auth.login(email, password); queryClient.clear(); setSession(s); const b = s.businesses.find(b => b.id === s.activeBusinessId); if (b) await i18n.changeLanguage(b.locale); },
    async logout() { await api.auth.logout(); queryClient.clear(); setSession(null); },
    switchBusiness(id) { if (!session?.businesses.some(b => b.id === id)) return; queryClient.clear(); setSession({ ...session, activeBusinessId: id }); void i18n.changeLanguage(session.businesses.find(b => b.id === id)!.locale); },
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
  return { ...auth, business, industry: industries[business.industry], locale: i18n.language as Locale };
}
