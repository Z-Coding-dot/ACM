import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Clock3, SlidersHorizontal, UserRound, UsersRound, ShieldCheck, Save } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { useWorkspace } from '../../app/workspace';
import { businessSchema } from '../../lib/validation';
import { uiSpring } from '../../lib/motion';
import { industries } from '../../config/industries';
import { timeZones, currencies } from '../../config/options';
import { api } from '../../services';
import { ApiError } from '../../services/errors';
import { Button, PageHeading, Field, Input, ErrorState, Notice } from '../../components/ui/primitives';
import { HoursEditor } from '../../components/ui/hours-editor';
import { MembershipSettings } from './membership-settings';
import { AccountSettings } from './account-settings';
import { BusinessLogoSettings } from './business-logo-settings';
import './settings.css';

type Values = z.infer<typeof businessSchema>;
const sections = [
  { id: 'business', title: 'settings.business', hint: 'settings.profileHint', icon: Building2 },
  { id: 'hours', title: 'hours.title', hint: 'settings.hoursHint', icon: Clock3 },
  { id: 'preferences', title: 'settings.preferences', hint: 'settings.preferencesHint', icon: SlidersHorizontal },
  { id: 'account', title: 'account.settings', hint: 'settings.accountHint', icon: UserRound },
  { id: 'team', title: 'memberships.title', hint: 'memberships.hint', icon: UsersRound },
];
export function SettingsPage() {
  const { t, i18n } = useTranslation(), workspace = useWorkspace(), client = useQueryClient(), location = useLocation(), navigate = useNavigate(), reduced = useReducedMotion();
  const visible = sections.filter(section => section.id !== 'team' || workspace.can('memberships.write'));
  const section = visible.find(item => item.id === location.hash.slice(1)) || visible[0];
  const { register, handleSubmit, watch, setValue, reset, setError, formState: { errors, isDirty } } = useForm<Values>({ resolver: zodResolver(businessSchema), defaultValues: { ...workspace.business, currency: workspace.business.currency as Values['currency'] } });
  const mutation = useMutation({ mutationFn: (values: Values) => api.business.save(workspace.business.id, { ...values, id: workspace.business.id }), onSuccess: async business => { workspace.updateBusiness(business); reset({ ...business, currency: business.currency as Values['currency'] }); await i18n.changeLanguage(business.locale); await client.invalidateQueries({ queryKey: [business.id] }); }, onError: failure => { if (failure instanceof ApiError) for (const [field, messages] of Object.entries(failure.fields)) setError(field as keyof Values, { message: messages[0]?.startsWith('validation.') ? messages[0] : 'error.validation' }); } });
  const hoursError = errors.hours?.find?.(error => error?.close)?.close?.message || errors.hours?.message;
  const businessSection = ['business', 'hours', 'preferences'].includes(section.id);
  return <><PageHeading title={t('nav.settings')} description={t('settings.subtitle')} />
    <div className="settings-layout"><aside className="settings-navigation"><div className="settings-workspace"><span className="settings-workspace-logo">{workspace.business.logoUrl ? <img src={workspace.business.logoUrl} alt="" /> : <Building2 size={24} aria-hidden="true" />}</span><strong>{workspace.business.name}</strong><small>{t(`roles.${workspace.business.role || 'staff'}`)}</small></div>
      <nav aria-label={t('nav.settings')}>{visible.map(item => <Link key={item.id} to={`#${item.id}`} aria-current={section.id === item.id ? 'page' : undefined}><item.icon size={18} aria-hidden="true" /><span>{t(item.title)}</span></Link>)}</nav>
      <p className="settings-access"><ShieldCheck size={16} aria-hidden="true" />{t('settings.accessHint')}</p>
    </aside>
    <div className="settings-content"><m.section key={section.id} id={section.id} className="panel settings-card" initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={uiSpring}>
      <header className="settings-card-heading"><span className="settings-section-icon"><section.icon size={21} aria-hidden="true" /></span><div><h2>{t(section.title)}</h2><p>{t(section.hint)}</p></div></header>
      {section.id === 'business' && <BusinessLogoSettings />}
      {businessSection && <form className="settings-form" noValidate onSubmit={handleSubmit(values => mutation.mutate(values), invalid => { navigate(`#${invalid.hours ? 'hours' : invalid.appointmentSettings || invalid.locale ? 'preferences' : 'business'}`, { replace: true }); })}>
        {!workspace.can('business.write') && <Notice>{t('settings.readOnly')}</Notice>}
        <fieldset disabled={!workspace.can('business.write') || mutation.isPending} className="settings-fields">
        {section.id === 'business' && <><div className="form-grid">
          <Field id="business-name" label={t('settings.businessName')} error={errors.name?.message}><Input id="business-name" autoComplete="organization" {...register('name')} /></Field>
          <Field id="business-industry" label={t('settings.industry')}><select id="business-industry" className="input" {...register('industry')}>{Object.entries(industries).map(([key, config]) => <option key={key} value={key}>{t(config.label)}</option>)}</select></Field>
          {(['email', 'phone'] as const).map(key => <Field id={`business-${key}`} key={key} label={t(`customer.${key}`)} hint={t('common.optional')} error={errors[key]?.message}><Input id={`business-${key}`} dir="ltr" type={key === 'email' ? 'email' : 'tel'} {...register(key)} /></Field>)}
          <Field id="business-timezone" label={t('settings.timezone')} error={errors.timeZone?.message}><select id="business-timezone" className="input" dir="ltr" {...register('timeZone')}>{timeZones.map(zone => <option key={zone}>{zone}</option>)}</select></Field>
          <Field id="business-currency" label={t('settings.currency')}><select id="business-currency" className="input" {...register('currency')}>{currencies.map(currency => <option key={currency}>{currency}</option>)}</select></Field>
        </div><p className="settings-help">{t(industries[watch('industry')].guidance)}</p></>}
        {section.id === 'hours' && <><Notice>{t('appointment.timezone', { zone: watch('timeZone') })}</Notice><HoursEditor value={watch('hours')} onChange={hours => setValue('hours', hours, { shouldValidate: true, shouldDirty: true })} error={hoursError} /></>}
        {section.id === 'preferences' && <div className="settings-preferences"><div className="form-grid">
          <Field id="slot-minutes" label={t('settings.slot')} hint={t('settings.slotHint')} error={errors.appointmentSettings?.slotMinutes?.message}><Input id="slot-minutes" type="number" min={5} max={60} {...register('appointmentSettings.slotMinutes', { valueAsNumber: true })} /></Field>
          <Field id="workspace-language" label={t('settings.language')}><select id="workspace-language" className="input" {...register('locale')}><option value="en">{t('language.en')}</option><option value="fa-AF">{t('language.fa-AF')}</option></select></Field>
        </div><label className="settings-toggle"><div><strong>{t('settings.unassigned')}</strong><small>{t('settings.unassignedHint')}</small></div><input type="checkbox" {...register('appointmentSettings.allowUnassigned')} /></label><label className="settings-toggle"><div><strong>{t('settings.confirmation')}</strong><small>{t('settings.confirmationHint')}</small></div><input type="checkbox" {...register('appointmentSettings.requireConfirmation')} /></label><p className="settings-help">{t('settings.translationReview')}</p></div>}
        </fieldset>
        {mutation.error && <ErrorState error={mutation.error} />}{mutation.isSuccess && !isDirty && <Notice>{t('common.saved')}</Notice>}
        {workspace.can('business.write') && <footer className="settings-save"><span>{t(isDirty ? 'settings.unsaved' : 'settings.upToDate')}</span><div><Button variant="secondary" disabled={!isDirty || mutation.isPending} onClick={() => { reset({ ...workspace.business, currency: workspace.business.currency as Values['currency'] }); mutation.reset(); }}>{t('settings.discard')}</Button><Button type="submit" disabled={mutation.isPending || !isDirty}><Save size={16} aria-hidden="true" />{t(mutation.isPending ? 'common.saving' : 'settings.saveChanges')}</Button></div></footer>}
      </form>}
      {section.id === 'account' && <AccountSettings />}
      {section.id === 'team' && <MembershipSettings />}
    </m.section></div></div></>;
}
