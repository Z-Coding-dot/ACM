import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '../../services';
import { useAuth } from '../../app/workspace';
import { authDestination } from '../../lib/auth-destination';
import { businessSchema } from '../../lib/validation';
import { industries } from '../../config/industries';
import { currencies, timeZones } from '../../config/options';
import { BrandLogo } from '../../components/ui/brand';
import { LanguageDropdown } from '../../components/ui/language-dropdown';
import { HoursEditor } from '../../components/ui/hours-editor';
import { Button, Field, Input, ErrorState, Loading } from '../../components/ui/primitives';

type Values = z.infer<typeof businessSchema>;
export function OnboardingPage() {
  const auth = useAuth(), location = useLocation(), navigate = useNavigate(), { t, i18n } = useTranslation();
  const [error, setError] = useState<unknown>(null), [selecting, setSelecting] = useState(false);
  const destination = authDestination(location.state || { from: new URLSearchParams(location.search).get('returnTo') });
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(businessSchema), defaultValues: { name: '', email: auth.session?.user.email || '', phone: '', industry: 'other', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: i18n.language === 'fa-AF' ? 'fa-AF' : 'en', hours: Array.from({ length: 7 }, (_, day) => ({ day, open: '09:00', close: '17:00', closed: false })), appointmentSettings: { slotMinutes: 30, allowUnassigned: true, requireConfirmation: false } } });
  if (auth.loading) return <Loading />;
  if (!auth.session) return <Navigate to="/login" replace state={location.state} />;
  if (auth.session.user.emailVerified !== true) return <Navigate to="/verify-email" replace state={location.state} />;
  return <div className="auth-shell"><header className="auth-header"><BrandLogo description /><LanguageDropdown /></header><main className="onboarding-main"><section className="panel onboarding-panel"><h1>{t('onboarding.title')}</h1><p>{t('onboarding.description')}</p>{!!error && <ErrorState error={error} />}
    {!!auth.session.businesses.length && <section className="onboarding-workspaces"><h2>{t('onboarding.existing')}</h2>{auth.session.businesses.map(business => <Button key={business.id} variant="secondary" disabled={selecting || isSubmitting} onClick={() => { setSelecting(true); setError(null); void auth.switchBusiness(business.id).then(() => navigate(destination, { replace: true })).catch(setError).finally(() => setSelecting(false)); }}>{business.name}<ArrowRight size={17} className="directional" aria-hidden="true" /></Button>)}</section>}
    <details open={!auth.session.businesses.length}><summary>{t('onboarding.create')}</summary><form noValidate onSubmit={handleSubmit(async values => { setError(null); try { await api.business.create(values); await auth.refreshSession(); navigate(destination, { replace: true }); } catch (failure) { setError(failure); } })}>
      <div className="form-grid"><Field id="setup-name" label={t('settings.businessName')} error={errors.name?.message}><Input id="setup-name" autoComplete="organization" {...register('name')} /></Field>
        <Field id="setup-industry" label={t('settings.industry')} error={errors.industry?.message}><select className="input" id="setup-industry" {...register('industry')}>{Object.entries(industries).map(([id, config]) => <option key={id} value={id}>{t(config.label)}</option>)}</select></Field>
        <Field id="setup-timezone" label={t('settings.timezone')} error={errors.timeZone?.message}><select className="input" id="setup-timezone" dir="ltr" {...register('timeZone')}>{timeZones.map(zone => <option key={zone}>{zone}</option>)}</select></Field>
        <Field id="setup-currency" label={t('settings.currency')} error={errors.currency?.message}><select className="input" id="setup-currency" defaultValue="" {...register('currency')}><option value="" disabled>{t('common.select')}</option>{currencies.map(currency => <option key={currency}>{currency}</option>)}</select></Field>
        <Field id="setup-email" label={t('customer.email')} error={errors.email?.message}><Input id="setup-email" type="email" dir="ltr" {...register('email')} /></Field>
        <Field id="setup-phone" label={t('customer.phone')} hint={t('common.optional')} error={errors.phone?.message}><Input id="setup-phone" type="tel" dir="ltr" {...register('phone')} /></Field>
      </div><HoursEditor value={watch('hours')} onChange={hours => setValue('hours', hours, { shouldValidate: true })} error={errors.hours?.find?.(hour => hour?.close)?.close?.message} />
      <div className="form-actions"><Button type="submit" disabled={isSubmitting || selecting}>{t(isSubmitting ? 'common.saving' : 'onboarding.createAction')}<ArrowRight size={17} className="directional" aria-hidden="true" /></Button></div>
    </form></details>
    <Button variant="ghost" disabled={isSubmitting || selecting} onClick={() => void auth.logout().catch(setError)}>{t('auth.signout')}</Button>
  </section></main><footer className="auth-footer"><Link to="/"><ArrowLeft size={17} className="directional" aria-hidden="true" />{t('landing.backHome')}</Link></footer></div>;
}
