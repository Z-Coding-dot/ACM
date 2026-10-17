import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Clock3 } from 'lucide-react';
import { useWorkspace } from '../../app/workspace';
import { useResources } from '../../hooks/use-resources';
import type { Service } from '../../types/domain';
import { api } from '../../services';
import { serviceSchema } from '../../lib/validation';
import { currencyScale, formatMoney, toMinorUnits } from '../../lib/dates';
import { currencies } from '../../config/options';
import { Button, PageHeading, Field, Input, Loading, ErrorState, Dialog, EmptyState, Notice } from '../../components/ui/primitives';
type Values = z.infer<typeof serviceSchema>;
export function ServicesPage() {
  const { t } = useTranslation(); const { industry, locale, can } = useWorkspace(); const data = useResources({}, false);
  const [editing, setEditing] = useState<Service | 'new' | null>(null), [saved, setSaved] = useState(false);
  return <><PageHeading title={t(industry.serviceLabel)} description={t('service.subtitle')} actions={can('services.write') && <Button onClick={() => setEditing('new')}><Plus size={17} />{t('service.new')}</Button>} />{saved && <Notice>{t('common.saved')}</Notice>}<section className="panel">
    {data.loading ? <Loading /> : data.error ? <ErrorState error={data.error} retry={data.retry} /> : !data.services.length ? <EmptyState description={t('service.subtitle')} /> : <table className="data-table"><thead><tr><th>{t('service.name')}</th><th>{t('service.duration')}</th><th>{t('service.priceLabel')}</th><th>{t('appointment.status')}</th><th><span className="sr-only">{t('common.edit')}</span></th></tr></thead><tbody>{data.services.map(s => <tr key={s.id}><td data-label={t('service.name')}><strong>{s.name}</strong><small>{s.description}</small></td><td data-label={t('service.duration')}><span className="inline-icon"><Clock3 size={15} />{t('common.minutes', { count: s.durationMinutes })}</span></td><td data-label={t('service.priceLabel')}><bdi>{formatMoney(s.priceMinor, s.currency, locale)}</bdi></td><td data-label={t('appointment.status')}><span className={`status ${s.active ? 'status-confirmed' : 'status-cancelled'}`}>{t(s.active ? 'common.active' : 'common.inactive')}</span></td><td>{can('services.write') && <Button variant="ghost" aria-label={`${t('common.edit')}: ${s.name}`} onClick={() => setEditing(s)}><Pencil size={16} /></Button>}</td></tr>)}</tbody></table>}
  </section>{editing && <Dialog title={t(editing === 'new' ? 'service.new' : 'service.edit')} onClose={() => setEditing(null)}><ServiceForm service={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setSaved(true); }} /></Dialog>}</>;
}
function ServiceForm({ service, onClose, onSaved }: { service?: Service; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation(); const { business, industry } = useWorkspace(); const queryClient = useQueryClient();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Values>({ resolver: zodResolver(serviceSchema), defaultValues: service ? { ...service, price: service.priceMinor / currencyScale(service.currency), currency: service.currency as Values['currency'] } : { name: '', description: '', durationMinutes: 30, price: 0, currency: business.currency as Values['currency'], active: true } });
  const mutation = useMutation({ mutationFn: (v: Values) => api.services.save(business.id, { name: v.name, description: v.description, durationMinutes: v.durationMinutes, currency: v.currency, priceMinor: toMinorUnits(v.price, v.currency), active: v.active }, service?.id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [business.id] }); onSaved(); } });
  return <form noValidate onSubmit={handleSubmit(v => mutation.mutate(v))}><div className="form-grid"><Field id="service-name" label={t('service.name')} error={errors.name?.message}><Input id="service-name" {...register('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'service-name-error' : undefined} /></Field>
    {industry.serviceFields.includes('description') && <Field id="service-description" label={t('service.description')} error={errors.description?.message}><textarea id="service-description" className="input" rows={3} {...register('description')} /></Field>}
    {industry.serviceFields.includes('durationMinutes') && <Field id="service-duration" label={t('service.duration')} error={errors.durationMinutes?.message}><Input id="service-duration" type="number" min={5} max={480} {...register('durationMinutes', { valueAsNumber: true })} aria-invalid={!!errors.durationMinutes} aria-describedby={errors.durationMinutes ? 'service-duration-error' : undefined} /></Field>}
    {industry.serviceFields.includes('priceMinor') && <><Field id="service-price" label={t('service.price', { currency: watch('currency') })} error={errors.price?.message}><Input id="service-price" type="number" min={0} step={1 / currencyScale(watch('currency'))} {...register('price', { valueAsNumber: true })} aria-invalid={!!errors.price} aria-describedby={errors.price ? 'service-price-error' : undefined} /></Field><Field id="service-currency" label={t('service.currency')}><select id="service-currency" className="input" {...register('currency')}>{currencies.map(c => <option key={c}>{c}</option>)}</select></Field></>}
    <label className="checkbox-label full-span"><input type="checkbox" {...register('active')} />{t('service.active')}</label></div>{mutation.error && <ErrorState error={mutation.error} />}<div className="form-actions"><Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" disabled={mutation.isPending}>{t(mutation.isPending ? 'common.saving' : 'common.save')}</Button></div></form>;
}
