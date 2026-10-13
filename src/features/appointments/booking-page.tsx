import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Check, ArrowRight } from 'lucide-react';
import type { Appointment, AppointmentInput } from '../../types/domain';
import { useWorkspace } from '../../app/workspace';
import { useResources } from '../../hooks/use-resources';
import { bookingSchema } from '../../lib/validation';
import { dateInZone, todayInZone, formatDate, formatTime, formatMoney, timeInZone } from '../../lib/dates';
import { api, isDemo } from '../../services';
import { ApiError } from '../../services/errors';
import { Button, Field, Input, Dialog, ErrorState, Loading, PageHeading } from '../../components/ui/primitives';
import { CustomerForm } from '../customers/customer-form';
type BookingValues = z.infer<typeof bookingSchema>;
export function BookingPage({ appointment }: { appointment?: Appointment }) {
  const { t } = useTranslation(); const { business, industry, locale } = useWorkspace(); const data = useResources(); const [params] = useSearchParams(); const navigate = useNavigate(); const queryClient = useQueryClient();
  const [review, setReview] = useState(false), [addCustomer, setAddCustomer] = useState(false), [error, setError] = useState<unknown>(null);
  const { register, handleSubmit, watch, setValue, setError: setFieldError, formState: { errors } } = useForm<BookingValues>({ resolver: zodResolver(bookingSchema), defaultValues: {
    customerId: appointment?.customerId ?? params.get('customerId') ?? '', serviceId: appointment?.serviceId ?? '', staffId: appointment?.staffId ?? '', date: appointment ? dateInZone(appointment.startsAt, business.timeZone) : params.get('date') ?? todayInZone(business.timeZone), startsAt: appointment?.startsAt ?? '', notes: appointment?.notes ?? '',
  } });
  const values = watch();
  const available = useQuery({ queryKey: [business.id, 'availability', values.serviceId, values.staffId, values.date, appointment?.id], queryFn: () => api.appointments.availability(business.id, values.serviceId, values.staffId || null, values.date, appointment?.id), enabled: !!values.serviceId && !!values.date && (!!values.staffId || business.appointmentSettings.allowUnassigned) });
  const usedCalendarTime = useRef(false);
  useEffect(() => {
    const time = params.get('time');
    if (usedCalendarTime.current || !time || !available.data || available.isFetching) return;
    const slot = available.data.find(slot => timeInZone(slot, business.timeZone) === time);
    if (slot) { setValue('startsAt', slot); usedCalendarTime.current = true; }
  }, [available.data, available.isFetching, params, business.timeZone, setValue]);
  const mutation = useMutation({ mutationFn: (input: AppointmentInput) => api.appointments.save(business.id, input, appointment?.id), onSuccess: async a => { await queryClient.invalidateQueries({ queryKey: [business.id] }); navigate(`/app/appointments/${a.id}`, { state: { created: !appointment, saved: !!appointment } }); }, onError: e => { setError(e); setReview(false); void available.refetch(); if (e instanceof ApiError) for (const key of Object.keys(e.fields)) if (Object.keys(values).includes(key)) setFieldError(key as keyof BookingValues, { message: 'error.validation' }); } });
  function submit() { mutation.mutate({ customerId: values.customerId, serviceId: values.serviceId, staffId: industry.features.staffAssignment && values.staffId ? values.staffId : null, startsAt: values.startsAt, notes: values.notes, status: appointment?.status ?? (business.appointmentSettings.requireConfirmation ? 'scheduled' : 'confirmed') }); }
  if (data.loading) return <Loading />;
  if (data.error) return <ErrorState error={data.error} retry={data.retry} />;
  const service = data.services.find(s => s.id === values.serviceId), customer = data.customers.find(c => c.id === values.customerId), person = data.staff.find(s => s.id === values.staffId);
  const slots = available.data ?? [];
  return <><Link className="back-link" to={appointment ? `/app/appointments/${appointment.id}` : '/app/appointments'}>{t('common.back')} · {t('nav.appointments')}</Link><PageHeading title={t(appointment ? 'appointment.edit' : 'appointment.new')} description={t('appointment.timezone', { zone: business.timeZone })} />
    <div className="booking-layout"><section className="panel form-panel"><ol className="booking-steps"><li className={!review ? 'current' : 'done'}><span>{review ? <Check size={15} /> : 1}</span>{t('appointment.stepDetails')}</li><li className={review ? 'current' : ''}><span>2</span>{t('appointment.stepReview')}</li></ol>
    {!!error && <ErrorState error={error} />}
    {!review ? <form noValidate onSubmit={handleSubmit(() => { if (!values.staffId && !business.appointmentSettings.allowUnassigned) { setFieldError('staffId', { message: 'validation.required' }); return; } if (!slots.includes(values.startsAt)) { setFieldError('startsAt', { message: 'validation.future' }); return; } setError(null); setReview(true); })}><div className="form-grid">
      <Field id="booking-customer" label={t('appointment.customer')} error={errors.customerId?.message}><div className="input-with-action"><select className="input" id="booking-customer" {...register('customerId')} aria-invalid={!!errors.customerId} aria-describedby={errors.customerId ? 'booking-customer-error' : undefined}><option value="">{t('common.select')}</option>{data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Button variant="secondary" onClick={() => setAddCustomer(true)} aria-label={t('customer.new')}><Plus size={18} /></Button></div></Field>
      <Field id="booking-service" label={t('appointment.service')} error={errors.serviceId?.message}><select className="input" id="booking-service" {...register('serviceId', { onChange: () => { setValue('staffId', ''); setValue('startsAt', ''); } })} aria-invalid={!!errors.serviceId} aria-describedby={errors.serviceId ? 'booking-service-error' : undefined}><option value="">{t('common.select')}</option>{data.services.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} · {t('common.minutes', { count: s.durationMinutes })}</option>)}</select></Field>
      {industry.features.staffAssignment && <Field id="booking-staff" label={t('appointment.staff')} error={errors.staffId?.message}><select className="input" id="booking-staff" {...register('staffId', { onChange: () => setValue('startsAt', '') })} aria-invalid={!!errors.staffId} aria-describedby={errors.staffId ? 'booking-staff-error' : undefined}><option value="">{t(business.appointmentSettings.allowUnassigned ? 'common.unassigned' : 'common.select')}</option>{data.staff.filter(s => s.active && s.serviceIds.includes(values.serviceId)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>}
      <Field id="booking-date" label={t('appointment.date')} error={errors.date?.message}><Input id="booking-date" type="date" dir="ltr" min={todayInZone(business.timeZone)} {...register('date', { onChange: () => setValue('startsAt', '') })} aria-invalid={!!errors.date} /></Field>
      <div className="field full-span"><label htmlFor="booking-time">{t('appointment.time')}</label>{available.isFetching ? <Loading /> : available.error ? <ErrorState error={available.error} retry={() => void available.refetch()} /> : <><select id="booking-time" className="input" {...register('startsAt')} aria-invalid={!!errors.startsAt} aria-describedby={errors.startsAt ? 'booking-time-error' : undefined}><option value="">{t('common.select')}</option>{slots.map(slot => <option key={slot} value={slot}>{formatTime(slot, locale, business.timeZone)}</option>)}</select>{values.serviceId && (!!values.staffId || business.appointmentSettings.allowUnassigned) && !slots.length && <small>{t('appointment.noSlots')}</small>}</>}{errors.startsAt && <small id="booking-time-error" className="field-error" role="alert">{t(errors.startsAt.message!)}</small>}</div>
      <Field id="booking-notes" label={t('appointment.notes')} hint={t('appointment.notesHint')} error={errors.notes?.message}><textarea className="input" id="booking-notes" rows={3} {...register('notes')} /></Field>
    </div><div className="form-actions"><Link className="button button-secondary" to="/app/appointments">{t('common.cancel')}</Link><Button type="submit" disabled={available.isFetching || mutation.isPending}>{t('appointment.review')}<ArrowRight size={17} className="directional" /></Button></div></form> : <div><h2>{t('appointment.review')}</h2><p className="muted">{t('appointment.reviewHint')}</p><dl className="review-details"><div><dt>{t('appointment.customer')}</dt><dd>{customer?.name}</dd></div><div><dt>{t('appointment.service')}</dt><dd>{service?.name}</dd></div><div><dt>{t('appointment.staff')}</dt><dd>{person?.name ?? t('common.unassigned')}</dd></div><div><dt>{t('appointment.date')}</dt><dd>{formatDate(values.startsAt, locale, business.timeZone)}</dd></div><div><dt>{t('appointment.time')}</dt><dd><bdi>{formatTime(values.startsAt, locale, business.timeZone)}</bdi></dd></div>{service && <div><dt>{t('service.priceLabel')}</dt><dd><bdi>{formatMoney(service.priceMinor, service.currency, locale)}</bdi></dd></div>}<div><dt>{t('appointment.notes')}</dt><dd className="pre-wrap">{values.notes || t('common.empty')}</dd></div></dl><div className="form-actions"><Button variant="secondary" disabled={mutation.isPending} onClick={() => setReview(false)}>{t('common.back')}</Button><Button disabled={mutation.isPending} onClick={submit}>{t(mutation.isPending ? 'common.saving' : 'appointment.submit')}</Button></div></div>}
    </section><aside className="booking-aside"><CalendarSummary /><h3>{t('appointment.new')}</h3><p>{t(industry.guidance)}</p>{isDemo && <div className="notice"><span>{t('demo.notice')}</span></div>}</aside></div>
    {addCustomer && <Dialog title={t('customer.new')} onClose={() => setAddCustomer(false)}><CustomerForm onCancel={() => setAddCustomer(false)} onSaved={c => { setValue('customerId', c.id); setAddCustomer(false); }} /></Dialog>}</>;
}
function CalendarSummary() { return <div className="booking-symbol" aria-hidden="true"><Check size={24} /></div>; }

