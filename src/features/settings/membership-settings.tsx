import { useState } from 'react';
import { Eye, EyeOff, UserPlus, Link2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '../../app/workspace';
import { api } from '../../services';
import { ApiError } from '../../services/errors';
import type { Membership } from '../../types/domain';
import { Field, Input, Button, Loading, ErrorState, Notice, ConfirmDialog } from '../../components/ui/primitives';

type Role = Exclude<Membership['role'], 'owner'>;
type Action = { kind: 'create' | 'add' | 'role' | 'remove'; id?: string; role?: Role };
export function MembershipSettings() {
  const { t, i18n } = useTranslation(), { business, can } = useWorkspace(), client = useQueryClient();
  const [mode, setMode] = useState<'create' | 'existing'>('create');
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [visible, setVisible] = useState(false);
  const [role, setRole] = useState<Role>('staff'), [removing, setRemoving] = useState<Membership | null>(null), [success, setSuccess] = useState('');
  const query = useQuery({ queryKey: [business.id, 'memberships'], queryFn: () => api.memberships.list(business.id), enabled: can('memberships.write') });
  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      if (action.kind === 'create') return (await api.memberships.createAccount(business.id, { name, email, password, role })).verificationEmailSent;
      if (action.kind === 'add') await api.memberships.add(business.id, email, role);
      else if (action.kind === 'role') await api.memberships.setRole(business.id, action.id!, action.role!);
      else await api.memberships.remove(business.id, action.id!);
      return undefined;
    },
    onSuccess: async (sent, action) => {
      setRemoving(null);
      setSuccess(action.kind === 'create' ? sent ? 'memberships.created' : 'memberships.deliveryFailed' : 'common.saved');
      if (action.kind === 'create' || action.kind === 'add') { setName(''); setEmail(''); setPassword(''); setVisible(false); }
      await client.invalidateQueries({ queryKey: [business.id, 'memberships'] });
    },
  });
  const fieldError = (field: string) => { const message = mutation.error instanceof ApiError ? mutation.error.fields[field]?.[0] : undefined; return message ? i18n.exists(message) ? message : 'error.validation' : undefined; };
  const error = mutation.error instanceof ApiError && mutation.error.fields.email?.[0] && i18n.exists(mutation.error.fields.email[0]) ? new ApiError(mutation.error.fields.email[0], mutation.error.status) : mutation.error;
  function switchMode(next: 'create' | 'existing') { setMode(next); setPassword(''); setVisible(false); setSuccess(''); mutation.reset(); }
  if (!can('memberships.write')) return null;
  return <section className="membership-settings">
    {query.isPending ? <Loading /> : query.error ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <div className="membership-list">{query.data?.map(member => <div className="membership-row" key={member.id}><div><strong>{member.name}</strong><small><bdi>{member.email}</bdi></small>{member.emailVerified === false && <small className="membership-pending">{t('platform.unverified')}</small>}</div>{member.role === 'owner' ? <span>{t('roles.owner')}</span> : <><select className="input" aria-label={`${t('memberships.role')}: ${member.name}`} value={member.role} disabled={mutation.isPending} onChange={event => { setSuccess(''); mutation.mutate({ kind: 'role', id: member.id, role: event.target.value as Role }); }}>{(['administrator', 'receptionist', 'staff'] as const).map(value => <option key={value} value={value}>{t(`roles.${value}`)}</option>)}</select><Button variant="ghost" disabled={mutation.isPending} onClick={() => setRemoving(member)}>{t('memberships.remove')}</Button></>}</div>)}</div>}
    <div className="membership-add-heading"><h3>{t('memberships.addPerson')}</h3><p>{t('memberships.loginHint')}</p></div>
    <div className="membership-mode" role="group" aria-label={t('memberships.accountOption')}><Button variant={mode === 'create' ? 'primary' : 'secondary'} aria-pressed={mode === 'create'} disabled={mutation.isPending} onClick={() => switchMode('create')}><UserPlus size={17} aria-hidden="true" />{t('memberships.createAccount')}</Button><Button variant={mode === 'existing' ? 'primary' : 'secondary'} aria-pressed={mode === 'existing'} disabled={mutation.isPending} onClick={() => switchMode('existing')}><Link2 size={17} aria-hidden="true" />{t('memberships.existingAccount')}</Button></div>
    <form onSubmit={event => { event.preventDefault(); setSuccess(''); mutation.mutate({ kind: mode === 'create' ? 'create' : 'add' }); }}>
      <fieldset disabled={mutation.isPending}><div className="form-grid">
        {mode === 'create' && <Field id="member-name" label={t('customer.name')} error={fieldError('name')}><Input id="member-name" autoComplete="off" required maxLength={160} value={name} onChange={event => setName(event.target.value)} /></Field>}
        <Field id="member-email" label={t('customer.email')} error={fieldError('email')}><Input id="member-email" dir="ltr" type="email" autoComplete="off" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></Field>
        {mode === 'create' && <Field id="member-password" label={t('platform.initialPassword')} hint={t('auth.passwordHint')} error={fieldError('password')}><div className="password-control"><Input id="member-password" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={event => setPassword(event.target.value)} /><Button variant="ghost" className="password-toggle" aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')} aria-pressed={visible} aria-controls="member-password" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</Button></div></Field>}
        <Field id="member-role" label={t('memberships.role')} hint={t(`memberships.roleHelp.${role}`)}><select id="member-role" className="input" value={role} onChange={event => setRole(event.target.value as Role)}>{(['administrator', 'receptionist', 'staff'] as const).map(value => <option key={value} value={value}>{t(`roles.${value}`)}</option>)}</select></Field>
      </div><p className="membership-form-hint">{t(mode === 'create' ? 'memberships.newAccountHint' : 'memberships.existingAccountHint')}</p></fieldset>
      <div className="form-actions"><Button type="submit" disabled={mutation.isPending}>{t(mutation.isPending ? 'common.saving' : mode === 'create' ? 'memberships.createAndAdd' : 'memberships.add')}</Button></div>
    </form>
    {error && !removing && <ErrorState error={error} />}{success && <Notice>{t(success)}</Notice>}
    {removing && <ConfirmDialog title={t('memberships.remove')} description={t('memberships.removeHint', { name: removing.name })} action={t('memberships.remove')} onClose={() => setRemoving(null)} onConfirm={() => mutation.mutate({ kind: 'remove', id: removing.id })} pending={mutation.isPending} error={error} />}
  </section>;
}
