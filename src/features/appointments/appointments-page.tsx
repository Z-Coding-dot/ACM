import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { api } from '../../services';
import { statuses } from '../../types/domain';
import { useResources } from '../../hooks/use-resources';
import { useWorkspace } from '../../app/workspace';
import { Button, PageHeading, Field, Input, Dialog, Loading, ErrorState } from '../../components/ui/primitives';
import { AppointmentTable } from './appointment-table';
export function AppointmentsPage() {
  const { t } = useTranslation(); const { business } = useWorkspace(); const data = useResources();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(''), [status, setStatus] = useState(''), [staffId, setStaff] = useState(''), [from, setFrom] = useState(params.get('from') ?? ''), [to, setTo] = useState(params.get('to') ?? ''), [filtersOpen, setFiltersOpen] = useState(false);
  const query = useQuery({ queryKey: [business.id, 'appointment-search', { search, status, staffId, from, to }], queryFn: () => api.appointments.search(business.id, { search, status, staffId, from, to }), enabled: !from || !to || to >= from });
  const filters = <><Field id="status-filter" label={t('appointment.status')}><select id="status-filter" className="input" value={status} onChange={e => setStatus(e.target.value)}><option value="">{t('common.all')}</option>{statuses.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}</select></Field><Field id="staff-filter" label={t('appointment.staff')}><select id="staff-filter" className="input" value={staffId} onChange={e => setStaff(e.target.value)}><option value="">{t('common.all')}</option>{data.staff.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field id="from-filter" label={t('appointment.from')}><Input id="from-filter" dir="ltr" type="date" value={from} onChange={e => setFrom(e.target.value)} /></Field><Field id="to-filter" label={t('appointment.to')}><Input id="to-filter" dir="ltr" type="date" min={from} value={to} onChange={e => setTo(e.target.value)} /></Field></>;
  return <><PageHeading title={t('nav.appointments')} description={t('appointment.subtitle')} actions={<Link className="button button-primary" to="/app/appointments/new"><Plus size={17} />{t('appointment.new')}</Link>} />
    <section className="panel"><div className="table-toolbar"><div className="search-field"><Search size={18} aria-hidden="true" /><Input aria-label={t('appointment.search')} placeholder={t('appointment.search')} value={search} onChange={e => setSearch(e.target.value)} /></div><Button className="mobile-filter-button" variant="secondary" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={17} />{t('common.filters')}</Button><Button variant="ghost" onClick={() => { setSearch(''); setStatus(''); setStaff(''); setFrom(''); setTo(''); }}>{t('common.clear')}</Button></div><div className="desktop-filters filter-grid">{!filtersOpen && filters}</div>
    {from && to && to < from ? <p className="notice notice-error" role="alert">{t('appointment.invalidRange')}</p> : data.loading || query.isPending ? <Loading /> : data.error || query.error ? <ErrorState error={data.error || query.error} retry={() => { data.retry(); void query.refetch(); }} /> : <AppointmentTable appointments={query.data ?? []} customers={data.customers} services={data.services} staff={data.staff} />}</section>
    {filtersOpen && <Dialog title={t('common.filters')} onClose={() => setFiltersOpen(false)}><div className="filter-grid">{filters}</div><Button onClick={() => setFiltersOpen(false)}>{t('common.close')}</Button></Dialog>}</>;
}

