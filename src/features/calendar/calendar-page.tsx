import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useWorkspace } from '../../app/workspace';
import { useResources } from '../../hooks/use-resources';
import { PageHeading, Button, Loading, ErrorState, EmptyState, StatusBadge } from '../../components/ui/primitives';
import { addDays, clockTime, dateInZone, dayOfWeek, formatDate, formatTime, minutes, timeInZone, todayInZone, zonedTimestamp } from '../../lib/dates';
import type { Appointment } from '../../types/domain';
export function CalendarPage() {
  const { t } = useTranslation(); const { business, locale } = useWorkspace(); const data = useResources(); const [date, setDate] = useState(todayInZone(business.timeZone)), [view, setView] = useState<'day' | 'week' | 'list'>('week');
  const days = view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(date, -dayOfWeek(date) + i)) : [date];
  const all = data.appointments.filter(a => days.includes(dateInZone(a.startsAt, business.timeZone))).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const openHours = business.hours.filter(h => !h.closed);
  const startMinute = Math.floor(Math.min(...openHours.map(h => minutes(h.open)), 540) / 30) * 30;
  const endMinute = Math.ceil(Math.max(...openHours.map(h => minutes(h.close)), 1080) / 30) * 30;
  const times = Array.from({ length: (endMinute - startMinute) / 30 }, (_, i) => startMinute + i * 30);
  function slotAvailable(day: string, minute: number) {
    const h = business.hours.find(h => h.day === dayOfWeek(day));
    if (!h || h.closed || minute < minutes(h.open) || minute + business.appointmentSettings.slotMinutes > minutes(h.close)) return false;
    let ts: string;
    try { ts = zonedTimestamp(day, clockTime(minute), business.timeZone); } catch { return false; }
    if (new Date(ts).getTime() <= Date.now()) return false;
    const end = new Date(new Date(ts).getTime() + business.appointmentSettings.slotMinutes * 60000).toISOString();
    return (business.appointmentSettings.allowUnassigned ? [null, ...data.staff.filter(s => s.active)] : data.staff.filter(s => s.active)).some(s => {
      const sh = s?.hours.find(h => h.day === dayOfWeek(day));
      return (!s || (s.serviceIds.length && sh && !sh.closed && minute >= minutes(sh.open) && minute + business.appointmentSettings.slotMinutes <= minutes(sh.close))) && !data.appointments.some(a => a.staffId === (s?.id ?? null) && !['cancelled', 'no-show'].includes(a.status) && a.startsAt < end && a.endsAt > ts);
    });
  }
  function bookingUrl(day: string, minute: number) { return `/app/appointments/new?${new URLSearchParams({ date: day, time: clockTime(minute) })}`; }
  function event(a: Appointment, visual = false, lane = 0, laneCount = 1) {
    const start = minutes(timeInZone(a.startsAt, business.timeZone));
    const duration = (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60000;
    return <Link key={a.id} to={`/app/appointments/${a.id}`} className={`calendar-event event-${a.status}`} style={visual ? { top: `${(start - startMinute) * 2}px`, height: `${Math.max(duration * 2 - 3, 44)}px`, insetInlineStart: `calc(${100 * lane / laneCount}% + 3px)`, width: `calc(${100 / laneCount}% - 6px)` } : undefined}>
      <strong>{data.customers.find(c => c.id === a.customerId)?.name}</strong><span><bdi>{formatTime(a.startsAt, locale, business.timeZone)}</bdi> · {data.services.find(s => s.id === a.serviceId)?.name}</span><small>{data.staff.find(s => s.id === a.staffId)?.name ?? t('common.unassigned')}</small><span className="event-status">{t(`status.${a.status}`)}</span>
    </Link>;
  }
  return <><PageHeading title={t('nav.calendar')} description={t('calendar.subtitle')} actions={<Link className="button button-primary" to="/app/appointments/new"><Plus size={17} />{t('appointment.new')}</Link>} />
    <div className="calendar-toolbar"><div className="calendar-date-controls"><Button variant="secondary" aria-label={t('calendar.previous')} onClick={() => setDate(addDays(date, view === 'week' ? -7 : -1))}><ChevronLeft size={18} className="directional" /></Button><Button variant="secondary" onClick={() => setDate(todayInZone(business.timeZone))}>{t('calendar.today')}</Button><Button variant="secondary" aria-label={t('calendar.next')} onClick={() => setDate(addDays(date, view === 'week' ? 7 : 1))}><ChevronRight size={18} className="directional" /></Button><label><span className="sr-only">{t('appointment.date')}</span><input className="input" type="date" dir="ltr" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label></div><div className="segmented-control" role="group" aria-label={t('calendar.view')}>{(['day', 'week', 'list'] as const).map(v => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{t(`calendar.${v}`)}</button>)}</div></div>
    <p className="calendar-period">{formatDate(days[0], locale, business.timeZone)}{days.length > 1 && ` – ${formatDate(days[6], locale, business.timeZone)}`}<small>{t('appointment.timezone', { zone: business.timeZone })}</small></p>
    {data.loading ? <Loading /> : data.error ? <ErrorState error={data.error} retry={data.retry} /> : <>
      {view !== 'list' && <section className={`panel visual-calendar ${view}-view`} aria-label={t('nav.calendar')}><div className="calendar-grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}><div className="calendar-corner" />{days.map(day => <div className={`calendar-day-header ${day === todayInZone(business.timeZone) ? 'is-today' : ''}`} key={day}>{formatDate(day, locale, business.timeZone, { weekday: 'short', year: undefined, month: 'short', day: 'numeric' })}</div>)}<div className="calendar-time-axis">{times.map(minute => <div key={minute} style={{ height: 60 }}><bdi>{clockTime(minute)}</bdi></div>)}</div>
      {days.map(day => {
        const events = all.filter(a => dateInZone(a.startsAt, business.timeZone) === day);
        const laneEnds: number[] = [], lanes = events.map(a => { const start = new Date(a.startsAt).getTime(); let lane = laneEnds.findIndex(end => end <= start); if (lane < 0) lane = laneEnds.length; laneEnds[lane] = new Date(a.endsAt).getTime(); return lane; });
        return <div className="calendar-day-column" key={day} style={{ height: times.length * 60 }}>{times.map(minute => <div className="calendar-slot" key={minute} style={{ height: 60 }}>{slotAvailable(day, minute) && <Link to={bookingUrl(day, minute)} aria-label={t('calendar.slot', { time: clockTime(minute), date: formatDate(day, locale, business.timeZone) })}><Plus size={15} /></Link>}</div>)}{events.map((a, i) => event(a, true, lanes[i], laneEnds.length))}</div>;
      })}</div></section>}
      <section className={`calendar-list ${view === 'list' ? 'list-selected' : ''}`} aria-label={t('calendar.list')}>{days.map(day => <div key={day} className="panel calendar-list-day"><div className="panel-heading"><h2>{formatDate(day, locale, business.timeZone, { weekday: 'short' })}</h2><Link className="text-link" to={`/app/appointments/new?date=${day}`}><Plus size={16} />{t('appointment.new')}</Link></div>{all.filter(a => dateInZone(a.startsAt, business.timeZone) === day).length ? all.filter(a => dateInZone(a.startsAt, business.timeZone) === day).map(a => <div className="calendar-list-record" key={a.id}>{event(a)}<StatusBadge status={a.status} /></div>) : <EmptyState description={t('calendar.empty')} />}</div>)}</section>
    </>}
  </>;
}
