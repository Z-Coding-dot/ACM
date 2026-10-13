import { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil } from 'lucide-react';
import { api, isDemo } from '../../services';
import { useWorkspace } from '../../app/workspace';
import { useResources } from '../../hooks/use-resources';
import { PageHeading, Button, Dialog, Notice, Loading, ErrorState, EmptyState } from '../../components/ui/primitives';
import { CustomerForm } from './customer-form';
import { AppointmentTable } from '../appointments/appointment-table';
import { formatDate } from '../../lib/dates';
export function NewCustomerPage() {
  const { t } = useTranslation(); const navigate = useNavigate();
  return <><PageHeading title={t('customer.new')} description={t('customer.subtitle')} /><section className="panel form-panel"><CustomerForm onCancel={() => navigate('/app/customers')} onSaved={c => navigate(`/app/customers/${c.id}`, { state: { saved: true } })} /></section></>;
}
export function CustomerDetailPage() {
  const { id = '' } = useParams(); const { t } = useTranslation(); const { business, industry, locale } = useWorkspace(); const data = useResources(); const [editing, setEditing] = useState(false), [saved, setSaved] = useState(false);
  const location = useLocation();
  const query = useQuery({ queryKey: [business.id, 'customer', id], queryFn: () => api.customers.get(business.id, id) });
  if (query.isPending || data.loading) return <Loading />;
  if (query.error || data.error) return <ErrorState error={query.error || data.error} retry={() => { data.retry(); void query.refetch(); }} />;
  const customer = query.data!; const history = data.appointments.filter(a => a.customerId === id).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return <><Link className="back-link" to="/app/customers">{t('common.back')} · {t(industry.customerLabel)}</Link><PageHeading title={customer.name} description={t('customer.added', { date: formatDate(customer.createdAt, locale, business.timeZone) })} actions={<><Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={16} />{t('common.edit')}</Button><Link className="button button-primary" to={`/app/appointments/new?customerId=${id}`}><Plus size={17} />{t('appointment.new')}</Link></>} />{(saved || (location.state as { saved?: boolean } | null)?.saved) && <Notice>{t(isDemo ? 'common.savedDemo' : 'common.saved')}</Notice>}
    <section className="panel contact-detail"><h2>{t('customer.contact')}</h2><dl className="details-grid"><div><dt>{t('customer.email')}</dt><dd><bdi>{customer.email}</bdi></dd></div><div><dt>{t('customer.phone')}</dt><dd><bdi>{customer.phone}</bdi></dd></div>{industry.features.customerNotes && <div><dt>{t('customer.notes')}</dt><dd className="pre-wrap">{customer.notes || t('common.empty')}</dd></div>}</dl></section><section className="panel"><div className="panel-heading"><h2>{t('customer.history')}</h2></div>{history.length ? <AppointmentTable appointments={history} customers={data.customers} services={data.services} staff={data.staff} /> : <EmptyState description={t('customer.noHistory')} />}</section>
    {editing && <Dialog title={t('customer.edit')} onClose={() => setEditing(false)}><CustomerForm customer={customer} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); setSaved(true); }} /></Dialog>}</>;
}
