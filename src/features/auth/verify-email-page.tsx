import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useAuth } from '../../app/workspace';
import { api } from '../../services';
import { authDestination } from '../../lib/auth-destination';
import { BrandLogo } from '../../components/ui/brand';
import { LanguageDropdown } from '../../components/ui/language-dropdown';
import { Button, ErrorState, Loading, Notice } from '../../components/ui/primitives';

export function VerifyEmailPage() {
  const auth = useAuth(), location = useLocation(), { t } = useTranslation();
  const [pending, setPending] = useState(false), [error, setError] = useState<unknown>(null), [notice, setNotice] = useState('');
  if (auth.loading) return <Loading />;
  if (!auth.session) return <Navigate to="/login" replace state={location.state} />;
  if (auth.session.user.emailVerified === true) return <Navigate to={authDestination(location.state)} replace />;
  async function action(run: () => Promise<void>) { setPending(true); setError(null); setNotice(''); try { await run(); } catch (failure) { setError(failure); } finally { setPending(false); } }
  return <div className="auth-shell"><header className="auth-header"><BrandLogo description /><LanguageDropdown /></header><main className="auth-main"><section className="auth-card"><MailCheck size={28} aria-hidden="true" /><h1>{t('auth.verifyTitle')}</h1><p>{t('auth.verifyDescription', { email: auth.session.user.email })}</p>
    {auth.session.verificationEmailSent === false && <Notice>{t('auth.verifyDeliveryFailed')}</Notice>}{!!error && <ErrorState error={error} />}{notice && <Notice>{t(notice)}</Notice>}
    <div className="stack"><Button disabled={pending} onClick={() => void action(async () => { await api.auth.resendVerification(); setNotice('auth.verifySent'); })}>{t('auth.resendVerification')}</Button><Button variant="secondary" disabled={pending} onClick={() => void action(async () => { const session = await auth.refreshSession(); if (!session.user.emailVerified) setNotice('auth.verifyNotYet'); })}>{t('auth.checkVerification')}</Button><Button variant="ghost" disabled={pending} onClick={() => void action(auth.logout)}>{t('auth.signout')}</Button></div>
  </section></main><footer className="auth-footer"><Link to="/"><ArrowLeft size={17} className="directional" aria-hidden="true" />{t('landing.backHome')}</Link></footer></div>;
}
