import { useState } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { authSchema } from '../../lib/validation';
import { useAuth } from '../../app/workspace';
import { api } from '../../services';
import { ApiError } from '../../services/errors';
import { Button, Field, Input, ErrorState, Notice, Loading } from '../../components/ui/primitives';
import { BrandLogo } from '../../components/ui/brand';
import { uiSpring } from '../../lib/motion';
import { authDestination } from '../../lib/auth-destination';
import { googleAuthDestination } from '../../lib/google-auth';
import { LanguageDropdown } from '../../components/ui/language-dropdown';

export function AuthPage({ mode }: { mode: 'login' | 'signup' | 'forgot-password' | 'reset-password' }) {
  const { t, i18n } = useTranslation(); const auth = useAuth(); const navigate = useNavigate(); const location = useLocation(); const reduced = useReducedMotion();
  const requestedDestination = authDestination(location.state);
  const destination = auth.session?.user.platformAdmin && requestedDestination === '/app/overview' ? '/platform' : requestedDestination, parameters = new URLSearchParams(location.search);
  const oauthMessages: Record<string, string> = { denied: 'auth.googleDenied', state: 'auth.googleState', identity: 'auth.googleIdentity', link_required: 'auth.googleLinkRequired', unavailable: 'auth.googleUnavailable', failed: 'auth.googleFailed' };
  const oauthMessage = mode === 'login' ? oauthMessages[parameters.get('oauth') || ''] : undefined;
  const [error, setError] = useState<unknown>(oauthMessage ? new ApiError(oauthMessage) : null), [success, setSuccess] = useState(''), [visiblePassword, setVisiblePassword] = useState(false), [remember, setRemember] = useState(false);
  const { register, handleSubmit, setError: fieldError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(authSchema(mode)), defaultValues: { name: '', email: mode === 'reset-password' ? parameters.get('email') || '' : '', password: '', confirmation: '' } });
  const title = { login: 'auth.login', signup: 'auth.signup', 'forgot-password': 'auth.forgot', 'reset-password': 'auth.newPassword' }[mode];
  const hint = { login: 'auth.loginHint', signup: 'auth.signupHint', 'forgot-password': 'auth.forgotHint', 'reset-password': 'auth.newPasswordHint' }[mode];
  const action = { login: 'auth.signin', signup: 'auth.signup', 'forgot-password': 'auth.sendReset', 'reset-password': 'auth.resetAction' }[mode];
  const googleUrl = googleAuthDestination(import.meta.env.VITE_GOOGLE_AUTH_URL, destination, i18n.language === 'fa-AF' ? 'fa-AF' : 'en');
  if (auth.loading) return <Loading />;
  if (auth.session && mode !== 'reset-password') return <Navigate to={destination} replace />;
  return <div className="auth-shell"><header className="auth-header"><BrandLogo description /><LanguageDropdown /></header><main className="auth-main">
    <m.div className="auth-card" initial={{ y: reduced ? 0 : 16 }} animate={{ y: 0 }} transition={uiSpring}>
      <span className="eyebrow">{t('app.tagline')}</span><h1>{t(title)}</h1><p>{t(hint)}</p>
      {!!auth.bootError && <ErrorState error={auth.bootError} retry={auth.retrySession} />}{auth.expired && <Notice>{t('error.sessionExpired')}</Notice>}
      {['login', 'signup'].includes(mode) && <div className="auth-social"><Button variant="secondary" className="google-sign-in full-width" aria-describedby="google-status" disabled={isSubmitting} onClick={() => { if (googleUrl) window.location.assign(googleUrl); else setError(new ApiError('auth.googleUnavailable', 503)); }}><img src="/brand/google-g.png" width={20} height={20} alt="" aria-hidden="true" />{t('auth.google')}</Button><p id="google-status">{t(googleUrl ? 'auth.googleAvailable' : 'auth.googleHint')}</p><div className="auth-divider"><span>{t('auth.orEmail')}</span></div></div>}
      {!!error && <ErrorState error={error} />}{success && <Notice>{t(success)}</Notice>}
      {!(mode === 'reset-password' && success) && <form noValidate onSubmit={handleSubmit(async values => {
        setError(null); setSuccess('');
        try {
          if (mode === 'login') { const profile = await auth.login(values.email, values.password, remember, destination); navigate(profile.user.platformAdmin && destination === '/app/overview' ? '/platform' : destination, { replace: true }); }
          else if (mode === 'signup') { await auth.signup(values.name, values.email, values.password, values.confirmation, destination); navigate(destination, { replace: true }); }
          else if (mode === 'reset-password') { await auth.resetPassword(values.email, parameters.get('token') || '', values.password, values.confirmation); setSuccess('auth.passwordResetDone'); setVisiblePassword(false); }
          else { await api.auth.forgotPassword(values.email); setSuccess('auth.resetSent'); }
        } catch (failure) {
          setError(failure instanceof ApiError && failure.fields.token ? new ApiError('auth.invalidReset', 422) : failure);
          if (failure instanceof ApiError) for (const [key, messages] of Object.entries(failure.fields)) {
            const field = key === 'password_confirmation' ? 'confirmation' : key;
            if (['name', 'email', 'password', 'confirmation'].includes(field)) fieldError(field as 'name' | 'email' | 'password' | 'confirmation', { message: messages[0]?.startsWith('validation.') && i18n.exists(messages[0]) ? messages[0] : 'error.validation' });
          }
        }
      })}>
        {mode === 'signup' && <Field id="auth-name" label={t('customer.name')} error={errors.name?.message}><Input id="auth-name" autoComplete="name" {...register('name')} /></Field>}
        <Field id="auth-email" label={t('customer.email')} error={errors.email?.message}><Input id="auth-email" dir="ltr" type="email" autoComplete="email" {...register('email')} /></Field>
        {mode !== 'forgot-password' && <Field id="auth-password" label={t('auth.password')} hint={t('auth.passwordHint')} error={errors.password?.message}><div className="password-control"><Input id="auth-password" type={visiblePassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} {...register('password')} /><Button variant="ghost" className="password-toggle" aria-label={t(visiblePassword ? 'auth.hidePassword' : 'auth.showPassword')} aria-pressed={visiblePassword} aria-controls="auth-password" onClick={() => setVisiblePassword(value => !value)}>{visiblePassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</Button></div></Field>}
        {['signup', 'reset-password'].includes(mode) && <Field id="auth-confirmation" label={t('auth.confirmPassword')} error={errors.confirmation?.message}><Input id="auth-confirmation" type="password" autoComplete="new-password" {...register('confirmation')} /></Field>}
        {mode === 'login' && <div className="auth-options"><label className="checkbox-label"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} aria-describedby="remember-hint" />{t('auth.remember')}</label><Link to="/forgot-password" state={location.state}>{t('auth.forgotLink')}</Link><p id="remember-hint">{t('auth.rememberHint')}</p></div>}
        <Button type="submit" className="full-width" disabled={isSubmitting}>{t(isSubmitting ? 'common.loading' : action)}<ArrowRight size={17} className="directional" aria-hidden="true" /></Button>
      </form>}
      <div className="auth-links"><Link to={mode === 'login' ? '/signup' : '/login'} state={location.state}>{t(mode === 'login' ? 'auth.noAccount' : 'auth.haveAccount')}</Link></div>
    </m.div>
  </main><footer className="auth-footer"><Link to="/"><ArrowLeft size={17} className="directional" aria-hidden="true" />{t('landing.backHome')}</Link><Link to="/about#data">{t('landing.dataInfo')}</Link></footer></div>;
}
