import { useTranslation } from 'react-i18next';
import { CalendarCheck2, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../../components/ui/primitives';
import { formatDate, formatTime } from '../../lib/dates';
import type { Locale } from '../../types/domain';

export function ProductPreview() {
  const { t, i18n } = useTranslation(); const locale = i18n.language as Locale;
  const days = ['2026-10-13', '2026-10-14', '2026-10-15'];
  const bookings = [
    { name: 'landing.preview.sara', service: 'landing.preview.haircut', status: 'confirmed' as const },
    { name: 'landing.preview.laila', service: 'landing.preview.consultation', status: 'scheduled' as const },
    { name: 'landing.preview.omar', service: 'landing.preview.grooming', status: 'confirmed' as const },
  ];
  return <figure className="product-preview" aria-label={t('landing.preview.label')}>
    <div className="preview-window"><div className="preview-topbar"><span className="preview-workspace"><CalendarCheck2 size={18} aria-hidden="true" />{t('landing.preview.business')}</span><span className="preview-sample">{t('landing.preview.sample')}</span></div>
      <div className="preview-body"><div className="preview-rail" aria-hidden="true"><CalendarCheck2 className="is-active" size={19} /><Users size={19} /><Settings size={19} /></div><div className="preview-content">
        <div className="preview-heading"><h2>{t('nav.calendar')}</h2><span>{formatDate(days[0], locale, 'Asia/Kabul', { month: 'long', year: 'numeric', day: undefined })}</span></div>
        <div className="preview-calendar-controls"><span>{t('landing.preview.schedule')}</span><span aria-hidden="true"><ChevronLeft size={14} className="directional" /><ChevronRight size={14} className="directional" /></span></div>
        <table className="preview-calendar"><caption className="sr-only">{t('landing.preview.schedule')}</caption><thead><tr><th scope="col"><span className="sr-only">{t('appointment.time')}</span></th>{days.map(day => <th scope="col" key={day}>{formatDate(day, locale, 'Asia/Kabul', { weekday: 'short', month: undefined, year: undefined })}</th>)}</tr></thead><tbody>{bookings.map((booking, row) => <tr key={booking.name}><th scope="row"><bdi>{formatTime(`2026-10-13T0${4 + row}:30:00Z`, locale, 'Asia/Kabul')}</bdi></th>{days.map((day, column) => <td key={day}>{row === column && <div className={`preview-booking preview-booking-${booking.status}`}><strong>{t(booking.name)}</strong><span>{t(booking.service)}</span><StatusBadge status={booking.status} /></div>}</td>)}</tr>)}</tbody></table>
        <div className="preview-contacts"><h3>{t('landing.preview.contacts')}</h3><div>{[bookings[0], bookings[2]].map(booking => <div className="preview-contact" key={booking.name}><span className="preview-avatar" aria-hidden="true"><Users size={16} /></span><div><strong>{t(booking.name)}</strong><span>{t(booking.service)}</span></div></div>)}</div></div>
      </div></div>
    </div><figcaption><span className="status-dot" aria-hidden="true" />{t('landing.preview.caption')}</figcaption>
  </figure>;
}
