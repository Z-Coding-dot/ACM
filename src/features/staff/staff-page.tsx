import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Mail } from 'lucide-react';
import { useWorkspace } from '../../app/workspace';
import { useResources } from '../../hooks/use-resources';
import type { StaffMember, StaffInput } from '../../types/domain';
import { api, isDemo } from '../../services';
import { staffSchema } from '../../lib/validation';
import { defaultHours } from '../../config/hours';
import { Button, PageHeading, Field, Input, Loading, ErrorState, Dialog, EmptyState, Notice } from '../../components/ui/primitives';
import { HoursEditor } from '../../components/ui/hours-editor';
export function StaffPage() {
  const { t } = useTranslation(); const { industry } = useWorkspace(); const data = useResources();
  const [editing, setEditing] = useState<StaffMember | 'new' | null>(null), [profile, setProfile] = useState<StaffMember | null>(null), [saved, setSaved] = useState(false);
  return <><PageHeading title={t(industry.staffLabel)} description={t('staff.subtitle')} actions={<Button onClick={() => setEditing('new')}><Plus size={17} />{t('staff.new')}</Button>} />{saved && <Notice>{t(isDemo ? 'common.savedDemo' : 'common.saved')}</Notice>}
    {data.loading ? <Loading /> : data.error ? <ErrorState error={data.error} retry={data.retry} /> : !data.staff.length ? <EmptyState description={t('staff.subtitle')} /> : <div className="staff-grid">{data.staff.map(person => <article className="panel staff-card" key={person.id}><div className="staff-card-top"><span className="avatar avatar-large">{person.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span><span className={`status ${person.active ? 'status-confirmed' : 'status-cancelled'}`}>{t(person.active ? 'common.active' : 'common.inactive')}</span></div><h2>{person.name}</h2><span className="inline-icon muted"><Mail size={15} /><bdi>{person.email}</bdi></span><div className="staff-services"><span className="eyebrow">{t('staff.assignments')}</span>{person.serviceIds.length ? person.serviceIds.map(id => <span className="service-tag" key={id}>{data.services.find(s => s.id === id)?.name}</span>) : <small>{t('staff.noServices')}</small>}</div><div className="staff-actions"><Button variant="secondary" onClick={() => setProfile(person)}>{t('staff.profile')}</Button><Button variant="ghost" aria-label={`${t('common.edit')}: ${person.name}`} onClick={() => setEditing(person)}><Pencil size={16} /></Button></div></article>)}</div>}
    {profile && <Dialog title={t('staff.profile')} onClose={() => setProfile(null)}><h3>{profile.name}</h3><dl className="review-details"><div><dt>{t('customer.email')}</dt><dd><bdi>{profile.email}</bdi></dd></div><div><dt>{t('customer.phone')}</dt><dd><bdi>{profile.phone}</bdi></dd></div></dl><h3>{t('hours.title')}</h3><dl className="review-details">{profile.hours.map(h => <div key={h.day}><dt>{t(`hours.day.${h.day}`)}</dt><dd>{h.closed ? t('hours.closed') : <bdi>{h.open} – {h.close}</bdi>}</dd></div>)}</dl><Button variant="secondary" onClick={() => { setProfile(null); setEditing(profile); }}><Pencil size={16} />{t('common.edit')}</Button></Dialog>}
    {editing && <Dialog title={t(editing === 'new' ? 'staff.new' : 'staff.edit')} onClose={() => setEditing(null)}><StaffForm person={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setSaved(true); }} /></Dialog>}</>;
}
function StaffForm({ person, onClose, onSaved }: { person?: StaffMember; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation(); const { business } = useWorkspace(); const data = useResources(); const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StaffInput>({ resolver: zodResolver(staffSchema), defaultValues: person ?? { name: '', email: '', phone: '', active: true, serviceIds: [], hours: structuredClone(defaultHours) } });
  const mutation = useMutation({ mutationFn: (v: StaffInput) => api.staff.save(business.id, v, person?.id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [business.id] }); onSaved(); } });
  const hoursError = errors.hours?.find?.(e => e?.close)?.close?.message;
  return <form noValidate onSubmit={handleSubmit(v => mutation.mutate(v))}><div className="form-grid">{(['name', 'email', 'phone'] as const).map(key => <Field id={`staff-${key}`} key={key} label={t(`customer.${key}`)} error={errors[key]?.message}><Input id={`staff-${key}`} dir={key === 'name' ? undefined : 'ltr'} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} {...register(key)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `staff-${key}-error` : undefined} /></Field>)}<label className="checkbox-label"><input type="checkbox" {...register('active')} />{t('staff.active')}</label></div>
  <fieldset className="assignment-field"><legend>{t('staff.assignments')}</legend>{data.services.map(s => <label className="checkbox-label" key={s.id}><input type="checkbox" value={s.id} {...register('serviceIds')} />{s.name}{!s.active && <small>{t('common.inactive')}</small>}</label>)}</fieldset>
  <HoursEditor value={watch('hours')} onChange={h => setValue('hours', h, { shouldValidate: true })} error={hoursError} />{mutation.error && <ErrorState error={mutation.error} />}<div className="form-actions"><Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" disabled={mutation.isPending}>{t(mutation.isPending ? 'common.saving' : 'common.save')}</Button></div></form>;
}
