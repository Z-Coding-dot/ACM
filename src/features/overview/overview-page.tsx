import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, UserPlus, ArrowUpRight, CalendarDays, CheckCheck, Clock3, CircleCheck } from 'lucide-react';
import { useWorkspace } from '../../app/workspace';
import { useResources } from '../../hooks/use-resources';
import { PageHeading, Loading, ErrorState, EmptyState, StatusBadge } from '../../components/ui/primitives';
import { AppointmentTable } from '../appointments/appointment-table';
import { todayInZone, dateInZone, formatDate, formatTime } from '../../lib/dates';
import { statuses } from '../../types/domain';
export function OverviewPage() {
  const { t } = useTranslation(); const { business, industry, locale } = useWorkspace(); const data = useResources(); const today = todayInZone(business.timeZone);
  if (data.loading) return <Loading />;
  if (data.error) return <ErrorState error={data.error} retry={data.retry} />;
  const daily = data.appointments.filter(a => dateInZone(a.startsAt, business.timeZone) === today).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const next = data.appointments.filter(a => new Date(a.startsAt).getTime() > Date.now() && ['scheduled', 'confirmed'].includes(a.status)).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 3);
  const stats = [
    { key: 'overview.today', count: daily.filter(a => a.status !== 'cancelled').length, icon: CalendarDays },
    { key: 'overview.confirmed', count: daily.filter(a => a.status === 'confirmed').length, icon: CheckCheck },
    { key: 'overview.scheduled', count: daily.filter(a => a.status === 'scheduled').length, icon: Clock3 },
    { key: 'overview.completed', count: daily.filter(a => a.status === 'completed').length, icon: CircleCheck },
  ];
  return <><div className="date-eyebrow">{formatDate(today, locale, business.timeZone, { weekday: 'long' })}</div><PageHeading title={t('overview.title')} description={t('overview.subtitle')} actions={<><Link to="/app/customers/new" className="button button-secondary"><UserPlus size={17} />{t('customer.new')}</Link><Link to="/app/appointments/new" className="button button-primary"><Plus size={17} />{t('appointment.new')}</Link></>} />
    <div className="stats-grid">{stats.map(s => <article key={s.key} className="stat"><div><span>{t(s.key)}</span><strong>{new Intl.NumberFormat(locale).format(s.count)}</strong></div><span className="stat-icon"><s.icon size={20} aria-hidden="true" /></span></article>)}</div>
    <div className="overview-grid"><section className="panel upcoming-panel"><div className="panel-heading"><h2>{t('overview.upcoming')}</h2><Link to="/app/calendar" className="text-link">{t('nav.calendar')}<ArrowUpRight size={15} className="directional" /></Link></div>{next.length ? <div className="upcoming-list">{next.map(a => <Link className="upcoming-item" key={a.id} to={`/app/appointments/${a.id}`}><div className="upcoming-time"><strong><bdi>{formatTime(a.startsAt, locale, business.timeZone)}</bdi></strong><small>{formatDate(a.startsAt, locale, business.timeZone, { month: 'short', day: 'numeric', year: undefined })}</small></div><div className="upcoming-detail"><strong>{data.customers.find(c => c.id === a.customerId)?.name}</strong><small>{data.services.find(s => s.id === a.serviceId)?.name}</small><small>{data.staff.find(s => s.id === a.staffId)?.name ?? t('common.unassigned')}</small></div><StatusBadge status={a.status} /></Link>)}</div> : <EmptyState description={t('overview.noUpcoming')} />}</section>
    <section className="panel status-summary"><div className="panel-heading"><h2>{t('overview.statusSummary')}</h2></div><dl>{statuses.map(status => <div key={status}><dt><StatusBadge status={status} /></dt><dd>{new Intl.NumberFormat(locale).format(daily.filter(a => a.status === status).length)}</dd></div>)}</dl></section></div>
    <section className="panel"><div className="panel-heading"><div><h2>{t('overview.schedule')}</h2><small>{t('appointment.timezone', { zone: business.timeZone })}</small></div><Link className="text-link" to={`/app/appointments?from=${today}`}>{t('common.viewAll')}<ArrowUpRight size={15} className="directional" /></Link></div><AppointmentTable appointments={daily} customers={data.customers} services={data.services} staff={data.staff} showDate={false} /></section>
    <section className="panel recent-panel"><div className="panel-heading"><h2>{t('overview.recent')} · {t(industry.customerLabel)}</h2><Link className="text-link" to="/app/customers">{t('common.viewAll')}<ArrowUpRight size={15} className="directional" /></Link></div><div className="recent-grid">{[...data.customers].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4).map(c => <Link key={c.id} to={`/app/customers/${c.id}`}><span className="avatar">{c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span><span><strong>{c.name}</strong><small>{formatDate(c.createdAt, locale, business.timeZone)}</small></span></Link>)}</div></section></>;
}
