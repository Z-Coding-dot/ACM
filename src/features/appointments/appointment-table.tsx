import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { useWorkspace } from '../../app/workspace';
import type { Appointment, Customer, Service, StaffMember } from '../../types/domain';
import { formatDate, formatTime, formatMoney } from '../../lib/dates';
import { StatusBadge, EmptyState } from '../../components/ui/primitives';
export function AppointmentTable({ appointments, customers, services, staff, showDate = true }: { appointments: Appointment[]; customers: Customer[]; services: Service[]; staff: StaffMember[]; showDate?: boolean }) {
  const { t } = useTranslation(); const { business, locale } = useWorkspace();
  if (!appointments.length) return <EmptyState title={t('common.noResults')} description={t('common.adjustFilters')} />;
  return <table className="data-table appointment-table"><thead><tr><th>{t('appointment.time')}</th><th>{t('appointment.customer')}</th><th>{t('appointment.service')}</th><th>{t('appointment.staff')}</th><th>{t('appointment.status')}</th><th><span className="sr-only">{t('common.details')}</span></th></tr></thead><tbody>{appointments.map(a => {
    const c = { name: a.customerName ?? customers.find(c => c.id === a.customerId)?.name }, s = a.serviceName ? { name: a.serviceName, priceMinor: a.priceMinor!, currency: a.currency! } : services.find(s => s.id === a.serviceId), person = { name: a.staffName ?? staff.find(p => p.id === a.staffId)?.name };
    return <tr key={a.id}><td data-label={t('appointment.time')}><strong className="tabular"><bdi>{formatTime(a.startsAt, locale, business.timeZone)}</bdi></strong>{showDate && <small>{formatDate(a.startsAt, locale, business.timeZone)}</small>}</td><td data-label={t('appointment.customer')}><Link className="record-link" to={`/app/appointments/${a.id}`}>{c?.name}</Link></td><td data-label={t('appointment.service')}>{s?.name}{s && <small><bdi>{formatMoney(s.priceMinor, s.currency, locale)}</bdi></small>}</td><td data-label={t('appointment.staff')}>{person?.name ?? t('common.unassigned')}</td><td data-label={t('appointment.status')}><StatusBadge status={a.status} /></td><td><Link className="icon-link" to={`/app/appointments/${a.id}`} aria-label={`${t('common.details')}: ${c?.name}`}><ArrowUpRight size={18} className="directional" /></Link></td></tr>;
  })}</tbody></table>;
}
