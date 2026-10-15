import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '../../app/workspace';
import { api } from '../../services';
import { ApiError } from '../../services/errors';
import type { Membership } from '../../types/domain';
import { Field, Input, Button, Loading, ErrorState, Notice, ConfirmDialog } from '../../components/ui/primitives';
type Role = Exclude<Membership['role'], 'owner'>;
export function MembershipSettings() {
  const { t } = useTranslation(), { business, can } = useWorkspace(), client = useQueryClient();
  const [email, setEmail] = useState(''), [role, setRole] = useState<Role>('staff'), [removing, setRemoving] = useState<Membership | null>(null);
  const query = useQuery({ queryKey: [business.id, 'memberships'], queryFn: () => api.memberships.list(business.id), enabled: can('memberships.write') });
  const mutation = useMutation({ mutationFn: async (action: { kind: 'add' | 'role' | 'remove'; id?: string; role?: Role }) => { if (action.kind === 'add') await api.memberships.add(business.id, email, role); else if (action.kind === 'role') await api.memberships.setRole(business.id, action.id!, action.role!); else await api.memberships.remove(business.id, action.id!); }, onSuccess: async () => { setEmail(''); setRemoving(null); await client.invalidateQueries({ queryKey: [business.id, 'memberships'] }); } });
  const error = mutation.error instanceof ApiError && mutation.error.fields.email?.[0] === 'memberships.verifiedAccount' ? new ApiError('memberships.verifiedAccount', 422) : mutation.error;
  if (!can('memberships.write')) return null;
  return <section className="panel"><div className="panel-heading"><div><h2>{t('memberships.title')}</h2><p>{t('memberships.hint')}</p></div></div>
    {query.isPending ? <Loading /> : query.error ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <div className="membership-list">{query.data?.map(member => <div className="membership-row" key={member.id}><div><strong>{member.name}</strong><small><bdi>{member.email}</bdi></small></div>{member.role === 'owner' ? <span>{t('roles.owner')}</span> : <><select className="input" aria-label={`${t('memberships.role')}: ${member.name}`} value={member.role} disabled={mutation.isPending} onChange={e => mutation.mutate({ kind: 'role', id: member.id, role: e.target.value as Role })}>{(['administrator', 'receptionist', 'staff'] as const).map(value => <option key={value} value={value}>{t(`roles.${value}`)}</option>)}</select><Button variant="ghost" disabled={mutation.isPending} onClick={() => setRemoving(member)}>{t('memberships.remove')}</Button></>}</div>)}</div>}
    <form onSubmit={e => { e.preventDefault(); mutation.mutate({ kind: 'add' }); }}><div className="form-grid"><Field id="member-email" label={t('customer.email')}><Input id="member-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></Field><Field id="member-role" label={t('memberships.role')}><select id="member-role" className="input" value={role} onChange={e => setRole(e.target.value as Role)}>{(['administrator', 'receptionist', 'staff'] as const).map(value => <option key={value} value={value}>{t(`roles.${value}`)}</option>)}</select></Field></div><div className="form-actions"><Button type="submit" disabled={mutation.isPending}>{t('memberships.add')}</Button></div></form>
    {error && !removing && <ErrorState error={error} />}{mutation.isSuccess && <Notice>{t('common.saved')}</Notice>}
    {removing && <ConfirmDialog title={t('memberships.remove')} description={t('memberships.removeHint', { name: removing.name })} action={t('memberships.remove')} onClose={() => setRemoving(null)} onConfirm={() => mutation.mutate({ kind: 'remove', id: removing.id })} pending={mutation.isPending} error={error} />}
  </section>;
}
