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
  const { t } = useTranslation(); const { business, locale, can } = useWorkspace(); const [date, setDate] = useState(todayInZone(business.timeZone)), [view, setView] = useState<'day' | 'week' | 'list'>('week');
  const [range, setRange] = useState<'day' | 'week'>('week');
  const days = range === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(date, -dayOfWeek(date) + i)) : [date];
  const data = useResources({ from: days[0], to: days[days.length - 1] });
  const all = data.appointments.filter(a => days.includes(dateInZone(a.startsAt, business.timeZone))).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const openHours = business.hours.filter(h => !h.closed);
  const gridStep = business.appointmentSettings.slotMinutes * Math.ceil(30 / business.appointmentSettings.slotMinutes);
  const startMinute = Math.floor(Math.min(...openHours.map(h => minutes(h.open)), 540) / gridStep) * gridStep;
  const endMinute = Math.ceil(Math.max(...openHours.map(h => minutes(h.close)), 1080) / gridStep) * gridStep;
  const times = Array.from({ length: Math.ceil((endMinute - startMinute) / gridStep) }, (_, i) => startMinute + i * gridStep);
  function slotAvailable(day: string, minute: number) {
    const h = business.hours.find(h => h.day === dayOfWeek(day));
    if (!can('appointments.write') || !h || h.closed || minute < minutes(h.open) || minute + business.appointmentSettings.slotMinutes > minutes(h.close)) return false;
    let ts: string;
    try { ts = zonedTimestamp(day, clockTime(minute), business.timeZone); } catch { return false; }
    if (new Date(ts).getTime() <= Date.now() || (h.breaks ?? []).some(b => clockTime(minute) >= b.open && clockTime(minute) < b.close)) return false;
    const end = new Date(new Date(ts).getTime() + business.appointmentSettings.slotMinutes * 60000).toISOString();
    return (business.appointmentSettings.allowUnassigned ? [null, ...data.staff.filter(s => s.active)] : data.staff.filter(s => s.active)).some(s => {
      const sh = s?.hours.find(h => h.day === dayOfWeek(day));
      const alignedStart = Math.max(minutes(h.open), sh ? minutes(sh.open) : 0);
      return (minute - alignedStart) % business.appointmentSettings.slotMinutes === 0 && (!s || (!(sh?.breaks ?? []).some(b => clockTime(minute) >= b.open && clockTime(minute) < b.close) && s.serviceIds.some(id => data.services.some(service => service.id === id && service.active)) && sh && !sh.closed && minute >= minutes(sh.open) && minute + business.appointmentSettings.slotMinutes <= minutes(sh.close))) && !data.appointments.some(a => a.staffId === (s?.id ?? null) && !['cancelled', 'no-show'].includes(a.status) && a.startsAt < end && a.endsAt > ts);
    });
  }
  function listSlots(day: string) {
    const starts = new Set<number>(); const h = business.hours.find(h => h.day === dayOfWeek(day)); if (!h || h.closed) return [];
    const people = business.appointmentSettings.allowUnassigned ? [null, ...data.staff.filter(s => s.active)] : data.staff.filter(s => s.active);
    for (const person of people) { const sh = person?.hours.find(h => h.day === dayOfWeek(day)); if (person && (!sh || sh.closed)) continue; for (let m = Math.max(minutes(h.open), sh ? minutes(sh.open) : 0); m < minutes(h.close); m += business.appointmentSettings.slotMinutes) if (slotAvailable(day, m)) starts.add(m); }
    return [...starts].sort((a, b) => a - b);
  }
  function bookingUrl(day: string, minute: number) { return `/app/appointments/new?${new URLSearchParams({ date: day, time: clockTime(minute) })}`; }
  function event(a: Appointment, visual = false, lane = 0, laneCount = 1) {
    const start = minutes(timeInZone(a.startsAt, business.timeZone));
    const duration = (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60000;
    const customer = a.customerName ?? data.customers.find(c => c.id === a.customerId)?.name;
    const time = formatTime(a.startsAt, locale, business.timeZone), service = a.serviceName ?? data.services.find(s => s.id === a.serviceId)?.name;
    const staff = a.staffName ?? data.staff.find(s => s.id === a.staffId)?.name ?? t('common.unassigned'), status = t(`status.${a.status}`);
    const summary = [customer, time, service, staff, status].join(' · ');
    return <Link key={a.id} to={`/app/appointments/${a.id}`} className={`calendar-event event-${a.status}`} title={visual ? summary : undefined} aria-label={visual ? summary : undefined} style={visual ? { top: `${(start - startMinute) * 2}px`, height: `${Math.max(duration * 2 - 3, 44)}px`, insetInlineStart: `calc(${100 * lane / laneCount}% + ${44 * (1 - lane / laneCount) + 3}px)`, width: `calc(${100 / laneCount}% - ${44 / laneCount + 6}px)` } : undefined}>
      <strong>{customer}</strong><span><bdi>{time}</bdi>{!visual && ` · ${service}`}</span>{!visual && <><small>{staff}</small><span className="event-status">{status}</span></>}
    </Link>;
  }
  return <><PageHeading title={t('nav.calendar')} description={t('calendar.subtitle')} actions={can('appointments.write') && <Link className="button button-primary" to="/app/appointments/new"><Plus size={17} />{t('appointment.new')}</Link>} />
    <div className="calendar-toolbar"><div className="calendar-date-controls"><Button variant="secondary" aria-label={t('calendar.previous')} onClick={() => setDate(addDays(date, range === 'week' ? -7 : -1))}><ChevronLeft size={18} className="directional" /></Button><Button variant="secondary" onClick={() => setDate(todayInZone(business.timeZone))}>{t('calendar.today')}</Button><Button variant="secondary" aria-label={t('calendar.next')} onClick={() => setDate(addDays(date, range === 'week' ? 7 : 1))}><ChevronRight size={18} className="directional" /></Button><label><span className="sr-only">{t('appointment.date')}</span><input className="input" type="date" dir="ltr" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label></div><div className="segmented-control" role="group" aria-label={t('calendar.view')}>{(['day', 'week', 'list'] as const).map(v => <button key={v} aria-pressed={view === v} onClick={() => { setView(v); if (v !== 'list') setRange(v); }}>{t(`calendar.${v}`)}</button>)}</div></div>
    <p className="calendar-period">{formatDate(days[0], locale, business.timeZone)}{days.length > 1 && ` – ${formatDate(days[6], locale, business.timeZone)}`}<small>{t('appointment.timezone', { zone: business.timeZone })}</small></p>
    {data.loading ? <Loading /> : data.error ? <ErrorState error={data.error} retry={data.retry} /> : <>
      {view !== 'list' && <section className={`panel visual-calendar ${view}-view`} aria-label={t('nav.calendar')}><div className="calendar-grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}><div className="calendar-corner" />{days.map(day => <div className={`calendar-day-header ${day === todayInZone(business.timeZone) ? 'is-today' : ''}`} key={day}>{formatDate(day, locale, business.timeZone, { weekday: 'short', year: undefined, month: 'short', day: 'numeric' })}</div>)}<div className="calendar-time-axis">{times.map(minute => <div key={minute} style={{ height: gridStep * 2 }}><bdi>{clockTime(minute)}</bdi></div>)}</div>
      {days.map(day => {
        const events = all.filter(a => dateInZone(a.startsAt, business.timeZone) === day);
        const laneEnds: number[] = [], lanes = events.map(a => { const start = new Date(a.startsAt).getTime(); let lane = laneEnds.findIndex(end => end <= start); if (lane < 0) lane = laneEnds.length; laneEnds[lane] = new Date(a.endsAt).getTime(); return lane; });
        return <div className="calendar-day-column" key={day} style={{ height: times.length * gridStep * 2 }}>{times.map(minute => <div className="calendar-slot" key={minute} style={{ height: gridStep * 2 }}>{slotAvailable(day, minute) && <Link to={bookingUrl(day, minute)} aria-label={t('calendar.slot', { time: clockTime(minute), date: formatDate(day, locale, business.timeZone) })}><Plus size={15} /></Link>}</div>)}{events.map((a, i) => event(a, true, lanes[i], laneEnds.length))}</div>;
      })}</div></section>}
      <section className={`calendar-list ${view === 'list' ? 'list-selected' : ''}`} aria-label={t('calendar.list')}>{days.map(day => <div key={day} className="panel calendar-list-day"><div className="panel-heading"><h2>{formatDate(day, locale, business.timeZone, { weekday: 'short' })}</h2><Link className="text-link" to={`/app/appointments/new?date=${day}`}><Plus size={16} />{t('appointment.new')}</Link></div>{all.filter(a => dateInZone(a.startsAt, business.timeZone) === day).length ? all.filter(a => dateInZone(a.startsAt, business.timeZone) === day).map(a => <div className="calendar-list-record" key={a.id}>{event(a)}<StatusBadge status={a.status} /></div>) : <EmptyState description={t('calendar.empty')} />}<details className="calendar-available-list"><summary>{t('appointment.time')}</summary><div className="available-slot-links">{listSlots(day).map(minute => <Link key={minute} className="button button-secondary" to={bookingUrl(day, minute)} aria-label={t('calendar.slot', { time: clockTime(minute), date: formatDate(day, locale, business.timeZone) })}><bdi>{formatTime(zonedTimestamp(day, clockTime(minute), business.timeZone), locale, business.timeZone)}</bdi></Link>)}</div></details></div>)}</section>
    </>}
  </>;
}
