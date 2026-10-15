import { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Archive } from 'lucide-react';
import { api } from '../../services';
import { ApiError } from '../../services/errors';
import { useWorkspace } from '../../app/workspace';
import { useResources } from '../../hooks/use-resources';
import { PageHeading, Button, Dialog, Notice, Loading, ErrorState, EmptyState, ConfirmDialog } from '../../components/ui/primitives';
import { Pagination } from '../../components/ui/pagination';
import { CustomerForm } from './customer-form';
import { AppointmentTable } from '../appointments/appointment-table';
import { formatDate } from '../../lib/dates';
export function NewCustomerPage() {
  const { t } = useTranslation(), navigate = useNavigate(), { can } = useWorkspace();
  if (!can('customers.write')) return <ErrorState error={new ApiError('error.forbidden', 403)} />;
  return <><PageHeading title={t('customer.new')} description={t('customer.subtitle')} /><section className="panel form-panel"><CustomerForm onCancel={() => navigate('/app/customers')} onSaved={c => navigate(`/app/customers/${c.id}`, { state: { saved: true } })} /></section></>;
}
export function CustomerDetailPage() {
  const { id = '' } = useParams(), { t } = useTranslation(), { business, industry, locale, can } = useWorkspace(), location = useLocation();
  const data = useResources({}, false), queryClient = useQueryClient();
  const [editing, setEditing] = useState(false), [saved, setSaved] = useState(false), [archive, setArchive] = useState(false), [page, setPage] = useState(1);
  const query = useQuery({ queryKey: [business.id, 'customer', id], queryFn: () => api.customers.get(business.id, id) });
  const history = useQuery({ queryKey: [business.id, 'customer-history', id, page], queryFn: () => api.appointments.page(business.id, { customerId: id }, page) });
  const mutation = useMutation({ mutationFn: () => api.customers.archive(business.id, id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [business.id] }); setArchive(false); setSaved(true); } });
  if (query.isPending || history.isPending || data.loading) return <Loading />;
  if (query.error || history.error || data.error) return <ErrorState error={query.error || history.error || data.error} retry={() => { data.retry(); void query.refetch(); void history.refetch(); }} />;
  const customer = query.data!;
  return <><Link className="back-link" to="/app/customers">{t('common.back')} ? {t(industry.customerLabel)}</Link><PageHeading title={customer.name} description={t('customer.added', { date: formatDate(customer.createdAt, locale, business.timeZone) })} actions={<>{can('customers.write') && <Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={16} />{t('common.edit')}</Button>}{can('appointments.write') && customer.active !== false && <Link className="button button-primary" to={`/app/appointments/new?customerId=${id}`}><Plus size={17} />{t('appointment.new')}</Link>}{can('customers.write') && customer.active !== false && <Button variant="ghost" onClick={() => setArchive(true)}><Archive size={16} />{t('common.archive')}</Button>}</>} />{(saved || (location.state as { saved?: boolean } | null)?.saved) && <Notice>{t('common.saved')}</Notice>}{customer.active === false && <Notice>{t('common.inactive')}</Notice>}
    <section className="panel contact-detail"><h2>{t('customer.contact')}</h2><dl className="details-grid"><div><dt>{t('customer.email')}</dt><dd><bdi>{customer.email}</bdi></dd></div><div><dt>{t('customer.phone')}</dt><dd><bdi>{customer.phone}</bdi></dd></div>{industry.features.customerNotes && <div><dt>{t('customer.notes')}</dt><dd className="pre-wrap">{customer.notes || t('common.empty')}</dd></div>}</dl></section><section className="panel"><div className="panel-heading"><h2>{t('customer.history')}</h2></div>{history.data?.data.length ? <AppointmentTable appointments={history.data.data} customers={[customer]} services={data.services} staff={data.staff} /> : <EmptyState description={t('customer.noHistory')} />}{history.data && <Pagination page={page} lastPage={history.data.meta.lastPage} onPage={setPage} />}</section>
    {editing && <Dialog title={t('customer.edit')} onClose={() => setEditing(false)}><CustomerForm customer={customer} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); setSaved(true); }} /></Dialog>}
    {archive && <ConfirmDialog title={t('customer.archiveTitle')} description={t('customer.archiveHint')} action={t('common.archive')} onClose={() => setArchive(false)} onConfirm={() => mutation.mutate()} pending={mutation.isPending} error={mutation.error} />}
  </>;
}
