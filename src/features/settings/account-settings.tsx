import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Save } from 'lucide-react';
import { useAuth } from '../../app/workspace';
import { api } from '../../services';
import { ApiError } from '../../services/errors';
import { Button, Field, Input, ErrorState, Notice } from '../../components/ui/primitives';
import { PasswordSettings } from './password-settings';
import './settings.css';

export function AccountSettings() {
  const { t } = useTranslation(), workspace = useAuth();
  const schema = z.object({ name: z.string().trim().min(1, 'validation.required').max(160, 'validation.maxLength'), email: z.string().email('validation.email'), currentPassword: z.string() });
  const { register, handleSubmit, reset, watch, setError, formState: { errors, isDirty } } = useForm({ resolver: zodResolver(schema), defaultValues: { name: workspace.session!.user.name, email: workspace.session!.user.email, currentPassword: '' } });
  const mutation = useMutation({ mutationFn: (values: { name: string; email: string; currentPassword: string }) => api.auth.updateAccount(values.name, values.email, values.currentPassword || undefined), onSuccess: async profile => { reset({ name: profile.user.name, email: profile.user.email, currentPassword: '' }); await workspace.refreshSession(); }, onError: error => { if (error instanceof ApiError) for (const [key] of Object.entries(error.fields)) if (key === 'name' || key === 'email' || key === 'currentPassword') setError(key, { message: 'error.validation' }); } });
  return <><form noValidate onSubmit={handleSubmit(values => mutation.mutate(values))}>
    <div className="account-summary"><span className="avatar avatar-large">{workspace.session!.user.name.slice(0, 1)}</span><div><strong>{workspace.session!.user.name}</strong><small><bdi>{workspace.session!.user.email}</bdi></small></div><span className="account-verification"><ShieldCheck size={15} aria-hidden="true" />{t('settings.verified')}</span></div>
    <fieldset disabled={mutation.isPending} className="settings-fields"><div className="form-grid"><Field id="account-name" label={t('customer.name')} error={errors.name?.message}><Input id="account-name" autoComplete="name" {...register('name')} /></Field><Field id="account-email" label={t('customer.email')} error={errors.email?.message}><Input id="account-email" type="email" dir="ltr" autoComplete="email" {...register('email')} /></Field></div>
    <div className="settings-security"><p className="settings-help">{t('account.emailChangeHint')}</p>{watch('email') !== workspace.session!.user.email && <Field id="account-password" label={t('account.emailPassword')} error={errors.currentPassword?.message}><Input id="account-password" type="password" autoComplete="current-password" {...register('currentPassword')} /></Field>}</div></fieldset>
    {mutation.error && <ErrorState error={mutation.error} />}{mutation.isSuccess && <Notice>{t('common.saved')}</Notice>}
    <footer className="settings-save"><span>{t(isDirty ? 'settings.unsaved' : 'settings.upToDate')}</span><Button type="submit" disabled={mutation.isPending || !isDirty}><Save size={16} aria-hidden="true" />{t(mutation.isPending ? 'common.saving' : 'settings.saveChanges')}</Button></footer>
  </form><PasswordSettings /></>;
}
