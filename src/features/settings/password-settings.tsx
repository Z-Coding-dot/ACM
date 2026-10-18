import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../../app/workspace';
import { api } from '../../services';
import { ApiError } from '../../services/errors';
import { Button, ErrorState, Field, Input, Notice } from '../../components/ui/primitives';

export function PasswordSettings() {
  const { t, i18n } = useTranslation(), auth = useAuth();
  const hasPassword = auth.session!.user.hasPassword !== false;
  const [visible, setVisible] = useState(false);
  const schema = z.object({
    currentPassword: hasPassword ? z.string().min(1, 'validation.required') : z.string(),
    password: z.string().min(8, 'validation.password').max(72, 'validation.maxLength').refine(value => new TextEncoder().encode(value).length <= 72, 'validation.maxLength'),
    confirmation: z.string(),
  }).refine(values => values.password === values.confirmation, { message: 'validation.passwordMatch', path: ['confirmation'] });
  const { register, handleSubmit, reset, setError, formState: { errors, isDirty } } = useForm({ resolver: zodResolver(schema), defaultValues: { currentPassword: '', password: '', confirmation: '' } });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => api.auth.changePassword(values.password, values.confirmation, values.currentPassword || undefined),
    onSuccess: async () => { reset(); setVisible(false); await auth.refreshSession(); },
    onError: error => { if (error instanceof ApiError) for (const [key, messages] of Object.entries(error.fields)) if (key === 'password' || key === 'currentPassword') setError(key, { message: i18n.exists(messages[0]) ? messages[0] : 'error.validation' }); },
  });
  return <section className="password-settings" aria-labelledby="password-settings-heading">
    <header><KeyRound size={21} aria-hidden="true" /><div><h3 id="password-settings-heading">{t(hasPassword ? 'account.changePassword' : 'account.setPassword')}</h3><p>{t(hasPassword ? 'account.passwordHint' : 'account.googlePasswordHint')}</p></div></header>
    <form noValidate onSubmit={handleSubmit(values => mutation.mutate(values))}>
      <fieldset disabled={mutation.isPending} className="settings-fields">
        {hasPassword && <Field id="password-current" label={t('account.currentPassword')} error={errors.currentPassword?.message}><Input id="password-current" type="password" autoComplete="current-password" {...register('currentPassword')} /></Field>}
        <div className="form-grid"><Field id="password-new" label={t('account.newPassword')} hint={t('auth.passwordHint')} error={errors.password?.message}><div className="password-control"><Input id="password-new" type={visible ? 'text' : 'password'} autoComplete="new-password" maxLength={72} {...register('password')} /><Button variant="ghost" className="password-toggle" aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')} aria-pressed={visible} aria-controls="password-new" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</Button></div></Field>
          <Field id="password-confirmation" label={t('account.confirmPassword')} error={errors.confirmation?.message}><Input id="password-confirmation" type={visible ? 'text' : 'password'} autoComplete="new-password" maxLength={72} {...register('confirmation')} /></Field></div>
      </fieldset>
      {mutation.error && <ErrorState error={mutation.error} />}{mutation.isSuccess && !isDirty && <Notice>{t('account.passwordSaved')}</Notice>}
      <footer className="settings-save"><span>{t('account.otherSessions')}</span><Button type="submit" disabled={mutation.isPending || !isDirty}>{t(mutation.isPending ? 'common.saving' : hasPassword ? 'account.changePassword' : 'account.setPassword')}</Button></footer>
    </form>
  </section>;
}
