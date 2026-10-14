import { useTranslation } from 'react-i18next';
import { useId } from 'react';
import type { BusinessHours } from '../../types/domain';
import { minutes } from '../../lib/dates';
export function HoursEditor({ value, onChange, error }: { value: BusinessHours[]; onChange: (hours: BusinessHours[]) => void; error?: string }) {
  const { t } = useTranslation(); const id = useId();
  return <fieldset className="hours-editor"><legend>{t('hours.title')}</legend>{value.map((h, index) => <div className="hours-row" key={h.day}>
    <span>{t(`hours.day.${h.day}`)}</span><label className="checkbox-label"><input type="checkbox" aria-label={`${t(`hours.day.${h.day}`)}: ${t('hours.closed')}`} checked={h.closed} onChange={e => onChange(value.map((old, i) => i === index ? { ...old, closed: e.target.checked } : old))} />{t('hours.closed')}</label>
    <label><span className="sr-only">{t(`hours.day.${h.day}`)} {t('hours.open')}</span><input type="time" dir="ltr" className="input" aria-invalid={!!error && !h.closed && (!h.open || !h.close || minutes(h.close) <= minutes(h.open))} aria-describedby={error && !h.closed && (!h.open || !h.close || minutes(h.close) <= minutes(h.open)) ? `${id}-error` : undefined} disabled={h.closed} value={h.open} onChange={e => onChange(value.map((old, i) => i === index ? { ...old, open: e.target.value } : old))} /></label>
    <label><span className="sr-only">{t(`hours.day.${h.day}`)} {t('hours.close')}</span><input type="time" dir="ltr" className="input" aria-invalid={!!error && !h.closed && (!h.open || !h.close || minutes(h.close) <= minutes(h.open))} aria-describedby={error && !h.closed && (!h.open || !h.close || minutes(h.close) <= minutes(h.open)) ? `${id}-error` : undefined} disabled={h.closed} value={h.close} onChange={e => onChange(value.map((old, i) => i === index ? { ...old, close: e.target.value } : old))} /></label>
  </div>)}{error && <p id={`${id}-error`} role="alert" className="field-error">{t(error)}</p>}</fieldset>;
}
