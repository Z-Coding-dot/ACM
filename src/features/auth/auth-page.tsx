import { useState } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, CalendarCheck2, Users, UserRoundCog } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { authSchema } from '../../lib/validation';
import { useAuth } from '../../app/workspace';
import { api, isDemo } from '../../services';
import { ApiError } from '../../services/errors';
import { Button, Field, Input, ErrorState, Notice, Loading } from '../../components/ui/primitives';
import { BrandLogo, BrandMark } from '../../components/ui/brand';
import { Reveal } from '../../components/ui/motion';
import { uiSpring } from '../../lib/motion';
import { authDestination } from '../../lib/auth-destination';
import { googleAuthDestination } from '../../lib/google-auth';
import { LanguageDropdown } from '../../components/ui/language-dropdown';

export function AuthPage({ mode }: { mode: 'login' | 'signup' | 'forgot-password' }) {
  const { t } = useTranslation(); const auth = useAuth(); const navigate = useNavigate(); const location = useLocation(); const destination = authDestination(location.state); const reduced = useReducedMotion();
  const [error, setError] = useState<unknown>(null), [success, setSuccess] = useState(''), [demoLoading, setDemoLoading] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false), [remember, setRemember] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(authSchema(mode)), defaultValues: { name: '', email: '', password: '' } });
  const title = mode === 'login' ? 'auth.login' : mode === 'signup' ? 'auth.signup' : 'auth.forgot';
  const hint = mode === 'login' ? 'auth.loginHint' : mode === 'signup' ? 'auth.signupHint' : 'auth.forgotHint';
  const action = mode === 'login' ? 'auth.signin' : mode === 'signup' ? 'auth.signup' : 'auth.sendReset';
  const googleUrl = googleAuthDestination(import.meta.env.VITE_GOOGLE_AUTH_URL, destination, isDemo);
  if (auth.loading) return <Loading />;
  if (auth.session) return <Navigate to={destination} replace />;
  return <div className="auth-shell"><header className="auth-header"><BrandLogo description /><LanguageDropdown /></header><main className={`auth-main ${mode === 'forgot-password' ? 'auth-reset' : ''}`}>
    {mode !== 'forgot-password' && <aside className="auth-story"><Reveal><BrandMark size={56} /><p className="auth-story-eyebrow">{t('brand.fullName')}</p><p className="auth-story-title">{t('auth.storyTitle')}</p><p>{t('auth.storyDescription')}</p></Reveal><ul>{[{ icon: CalendarCheck2, id: 'schedule' }, { icon: Users, id: 'people' }, { icon: UserRoundCog, id: 'team' }].map((item, index) => <li key={item.id}><Reveal delay={index * .06}><item.icon size={22} aria-hidden="true" /><span><strong>{t(`auth.story.${item.id}`)}</strong><small>{t(`auth.story.${item.id}Hint`)}</small></span></Reveal></li>)}</ul><p className="auth-story-note">{t('auth.storyNote')}</p></aside>}
    <motion.div className="auth-card" initial={{ y: reduced ? 0 : 16 }} animate={{ y: 0 }} transition={uiSpring}><span className="eyebrow">{t('app.tagline')}</span><h1>{t(title)}</h1><p>{t(hint)}</p>
      {!!auth.bootError && <ErrorState error={auth.bootError} retry={auth.retrySession} />}{auth.expired && <Notice>{t('error.sessionExpired')}</Notice>}
      {mode !== 'forgot-password' && <div className="auth-social"><Button variant="secondary" className="google-sign-in full-width" aria-describedby="google-status" disabled={isSubmitting || demoLoading} onClick={() => { setError(null); if (googleUrl) window.location.assign(googleUrl); else setError(new ApiError('auth.googleUnavailable', 501)); }}><img src="/brand/google-g.png" width={20} height={20} alt="" aria-hidden="true" />{t('auth.google')}</Button><p id="google-status">{t(googleUrl ? 'auth.googleAvailable' : 'auth.googleHint')}</p><div className="auth-divider"><span>{t('auth.orEmail')}</span></div></div>}
      <form noValidate onSubmit={handleSubmit(async values => { setError(null); setSuccess(''); try { if (mode === 'login') { await auth.login(values.email, values.password, remember); navigate(destination, { replace: true }); } else if (mode === 'signup') { await api.auth.signup(values.name, values.email, values.password); setSuccess('auth.signupSent'); } else { await api.auth.forgotPassword(values.email); setSuccess('auth.resetSent'); } } catch (e) { setError(e); } })}>
        {mode === 'signup' && <Field id="auth-name" label={t('customer.name')} error={errors.name?.message}><Input id="auth-name" autoComplete="name" {...register('name')} /></Field>}
        <Field id="auth-email" label={t('customer.email')} error={errors.email?.message}><Input id="auth-email" dir="ltr" type="email" autoComplete="email" {...register('email')} /></Field>
        {mode !== 'forgot-password' && <Field id="auth-password" label={t('auth.password')} hint={t('auth.passwordHint')} error={errors.password?.message}><div className="password-control"><Input id="auth-password" type={visiblePassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} {...register('password')} /><Button variant="ghost" className="password-toggle" aria-label={t(visiblePassword ? 'auth.hidePassword' : 'auth.showPassword')} aria-pressed={visiblePassword} aria-controls="auth-password" onClick={() => setVisiblePassword(value => !value)}>{visiblePassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</Button></div></Field>}
        {mode === 'login' && <div className="auth-options"><label className="checkbox-label"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} aria-describedby="remember-hint" />{t('auth.remember')}</label><Link to="/forgot-password" state={location.state}>{t('auth.forgotLink')}</Link><p id="remember-hint">{t(isDemo ? 'auth.rememberDemo' : 'auth.rememberHint')}</p></div>}
        {!!error && <ErrorState error={error} />}{success && <Notice>{t(success)}</Notice>}<Button type="submit" className="full-width" disabled={isSubmitting || demoLoading}>{isSubmitting ? t('common.loading') : t(action)}<ArrowRight size={17} className="directional" aria-hidden="true" /></Button>
      </form><div className="auth-links"><Link to={mode === 'login' ? '/signup' : '/login'} state={location.state}>{t(mode === 'login' ? 'auth.noAccount' : 'auth.haveAccount')}</Link></div>
      {isDemo ? <div className="auth-demo"><span className="demo-pill">{t('demo.label')}</span><p dir="ltr">{t('demo.credentials')}</p><Button variant="secondary" className="full-width" disabled={demoLoading || isSubmitting} onClick={() => { setError(null); setDemoLoading(true); void auth.login('demo@acm.example', 'Demo1234!', remember).then(() => navigate(destination, { replace: true })).catch(setError).finally(() => setDemoLoading(false)); }}>{demoLoading ? t('common.loading') : t('demo.enter')}</Button></div> : <small>{t('auth.liveHint')}</small>}
    </motion.div>
  </main><footer className="auth-footer"><Link to="/">{t('landing.backHome')}</Link><Link to="/about#data">{t('landing.dataInfo')}</Link></footer></div>;
}
