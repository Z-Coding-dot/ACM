import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '../../app/workspace';
import { useResources } from '../../hooks/use-resources';
import { api } from '../../services';
import type { AppointmentStatus } from '../../types/domain';
import { formatDate, formatTime } from '../../lib/dates';
import { PageHeading, Loading, ErrorState, Button, Notice, StatusBadge, ConfirmDialog } from '../../components/ui/primitives';
import { BookingPage } from './booking-page';
export function AppointmentDetailPage() {
  const { id = '' } = useParams(); const { t } = useTranslation(); const { business, locale } = useWorkspace(); const data = useResources(); const [params] = useSearchParams(); const location = useLocation(); const queryClient = useQueryClient(); const [cancelOpen, setCancelOpen] = useState(false), [saved, setSaved] = useState(false);
  const query = useQuery({ queryKey: [business.id, 'appointment', id], queryFn: () => api.appointments.get(business.id, id) });
  const mutation = useMutation({ mutationFn: (status: AppointmentStatus) => api.appointments.setStatus(business.id, id, status), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [business.id] }); setCancelOpen(false); setSaved(true); } });
  if (query.isPending || data.loading) return <Loading />;
  if (query.error || data.error) return <ErrorState error={query.error || data.error} retry={() => { data.retry(); void query.refetch(); }} />;
  const a = query.data!, customer = { name: a.customerName ?? data.customers.find(c => c.id === a.customerId)?.name }, service = { name: a.serviceName ?? data.services.find(s => s.id === a.serviceId)?.name }, person = { name: a.staffName ?? data.staff.find(s => s.id === a.staffId)?.name };
  const editable = business.permissions?.includes('appointments.write') && ['scheduled', 'confirmed'].includes(a.status);
  if (params.get('edit') === '1' && editable) return <BookingPage key={a.id} appointment={a} />;
  const state = location.state as { created?: boolean; saved?: boolean } | null;
  return <><Link className="back-link" to="/app/appointments">{t('common.back')} · {t('nav.appointments')}</Link><PageHeading title={t('appointment.detail')} description={`${customer?.name} · ${service?.name}`} actions={<StatusBadge status={a.status} />} />
    {(saved || state?.created || state?.saved) && <Notice>{t(state?.created ? 'appointment.createdLive' : 'common.saved')}</Notice>}
    <section className="panel detail-panel"><dl className="details-grid"><div><dt>{t('appointment.customer')}</dt><dd><Link to={`/app/customers/${a.customerId}`}>{customer?.name}</Link></dd></div><div><dt>{t('appointment.service')}</dt><dd>{service?.name}</dd></div><div><dt>{t('appointment.staff')}</dt><dd>{person?.name ?? t('common.unassigned')}</dd></div><div><dt>{t('appointment.date')}</dt><dd>{formatDate(a.startsAt, locale, business.timeZone)}</dd></div><div><dt>{t('appointment.time')}</dt><dd><bdi>{formatTime(a.startsAt, locale, business.timeZone)} – {formatTime(a.endsAt, locale, business.timeZone)}</bdi></dd></div><div><dt>{t('settings.timezone')}</dt><dd><bdi>{business.timeZone}</bdi></dd></div><div><dt>{t('appointment.notes')}</dt><dd className="pre-wrap">{a.notes || t('common.empty')}</dd></div></dl>
    {mutation.error && !cancelOpen && <ErrorState error={mutation.error} />}<div className="form-actions">{a.status === 'scheduled' && <Button variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate('confirmed')}>{t('appointment.markConfirmed')}</Button>}{editable && new Date(a.startsAt).getTime() <= Date.now() && <><Button variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate('completed')}>{t('appointment.markCompleted')}</Button><Button variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate('no-show')}>{t('appointment.markNoShow')}</Button></>}{editable && <><Link className="button button-secondary" to={`?edit=1`}>{t('appointment.reschedule')}</Link><Button variant="danger" disabled={mutation.isPending} onClick={() => { mutation.reset(); setCancelOpen(true); }}>{t('appointment.cancel')}</Button></>}</div></section>
    {cancelOpen && <ConfirmDialog title={t('appointment.cancelTitle')} description={t('appointment.cancelDescription')} action={t('appointment.cancel')} onClose={() => setCancelOpen(false)} onConfirm={() => mutation.mutate('cancelled')} pending={mutation.isPending} error={mutation.error} />}</>;
}
