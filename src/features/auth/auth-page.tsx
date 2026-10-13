import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck2, ArrowRight } from 'lucide-react';
import { authSchema } from '../../lib/validation';
import { useAuth } from '../../app/workspace';
import { api, isDemo } from '../../services';
import { Button, Field, Input, ErrorState, Notice, Loading } from '../../components/ui/primitives';
import { LanguageDropdown } from '../../components/ui/language-dropdown';
export function AuthPage({ mode }: { mode: 'login' | 'signup' | 'forgot-password' }) {
  const { t } = useTranslation(); const auth = useAuth(); const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null), [success, setSuccess] = useState(''), [demoLoading, setDemoLoading] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(authSchema(mode)), defaultValues: { name: '', email: '', password: '' } });
  const title = mode === 'login' ? 'auth.login' : mode === 'signup' ? 'auth.signup' : 'auth.forgot';
  const hint = mode === 'login' ? 'auth.loginHint' : mode === 'signup' ? 'auth.signupHint' : 'auth.forgotHint';
  const action = mode === 'login' ? 'auth.signin' : mode === 'signup' ? 'auth.signup' : 'auth.sendReset';
  if (auth.loading) return <Loading />;
  if (auth.session) return <Navigate to="/app/overview" replace />;
  return <div className="auth-shell"><header className="auth-header"><Link to="/login" className="brand"><span className="brand-icon"><CalendarCheck2 size={23} /></span><strong>{t('app.name')}</strong></Link><LanguageDropdown /></header><main className="auth-main"><div className="auth-card"><span className="eyebrow">{t('app.tagline')}</span><h1>{t(title)}</h1><p>{t(hint)}</p>
    <form noValidate onSubmit={handleSubmit(async values => { setError(null); setSuccess(''); try { if (mode === 'login') { await auth.login(values.email, values.password); navigate('/app/overview'); } else if (mode === 'signup') { await api.auth.signup(values.name, values.email, values.password); setSuccess('auth.signupSent'); } else { await api.auth.forgotPassword(values.email); setSuccess('auth.resetSent'); } } catch (e) { setError(e); } })}>
      {mode === 'signup' && <Field id="auth-name" label={t('customer.name')} error={errors.name?.message}><Input id="auth-name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'auth-name-error' : undefined} {...register('name')} /></Field>}
      <Field id="auth-email" label={t('customer.email')} error={errors.email?.message}><Input id="auth-email" dir="ltr" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'auth-email-error' : undefined} {...register('email')} /></Field>
      {mode !== 'forgot-password' && <Field id="auth-password" label={t('auth.password')} hint={t('auth.passwordHint')} error={errors.password?.message}><Input id="auth-password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'auth-password-error' : 'auth-password-hint'} {...register('password')} /></Field>}
      {!!error && <ErrorState error={error} />}{success && <Notice>{t(success)}</Notice>}<Button type="submit" className="full-width" disabled={isSubmitting || demoLoading}>{isSubmitting ? t('common.loading') : t(action)}<ArrowRight size={17} className="directional" /></Button>
    </form><div className="auth-links">{mode === 'login' && <Link to="/forgot-password">{t('auth.forgotLink')}</Link>}<Link to={mode === 'login' ? '/signup' : '/login'}>{t(mode === 'login' ? 'auth.noAccount' : 'auth.haveAccount')}</Link></div>
    {isDemo ? <div className="auth-demo"><span className="demo-pill">{t('demo.label')}</span><p dir="ltr">{t('demo.credentials')}</p><Button variant="secondary" className="full-width" disabled={demoLoading || isSubmitting} onClick={() => { setError(null); setDemoLoading(true); void auth.login('demo@acm.example', 'Demo1234!').then(() => navigate('/app/overview')).catch(setError).finally(() => setDemoLoading(false)); }}>{demoLoading ? t('common.loading') : t('demo.enter')}</Button></div> : <small>{t('auth.liveHint')}</small>}
  </div></main></div>;
}

