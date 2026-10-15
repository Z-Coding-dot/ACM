import { useTranslation } from 'react-i18next';
import { useId } from 'react';
import { Plus, X } from 'lucide-react';
import type { BusinessHours } from '../../types/domain';
import { Button } from './primitives';
export function HoursEditor({ value, onChange, error }: { value: BusinessHours[]; onChange: (hours: BusinessHours[]) => void; error?: string }) {
  const { t } = useTranslation(), id = useId();
  const update = (index: number, changes: Partial<BusinessHours>) => onChange(value.map((h, i) => i === index ? { ...h, ...changes } : h));
  return <fieldset className="hours-editor"><legend>{t('hours.title')}</legend>{value.map((h, index) => <div className="hours-day" key={h.day}>
    <div className="hours-row"><span>{t(`hours.day.${h.day}`)}</span><label className="checkbox-label"><input type="checkbox" aria-label={`${t(`hours.day.${h.day}`)}: ${t('hours.closed')}`} checked={h.closed} onChange={e => update(index, { closed: e.target.checked })} />{t('hours.closed')}</label>
      {(['open', 'close'] as const).map(key => <label key={key}><span className="sr-only">{t(`hours.day.${h.day}`)} {t(`hours.${key}`)}</span><input className="input" type="time" dir="ltr" disabled={h.closed} value={h[key]} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} onChange={e => update(index, { [key]: e.target.value })} /></label>)}
    </div>{!h.closed && <div className="hours-breaks">{(h.breaks ?? []).map((b, i) => <div className="hours-break-row" key={i}><span>{t('hours.breaks')} {new Intl.NumberFormat().format(i + 1)}</span>
      {(['open', 'close'] as const).map(key => <label key={key}><span className="sr-only">{t(`hours.day.${h.day}`)} {t('hours.breaks')} {i + 1} {t(`hours.${key}`)}</span><input className="input" type="time" dir="ltr" value={b[key]} onChange={e => update(index, { breaks: h.breaks!.map((old, n) => n === i ? { ...old, [key]: e.target.value } : old) })} /></label>)}
      <Button variant="ghost" aria-label={`${t('hours.removeBreak')}: ${t(`hours.day.${h.day}`)} ${i + 1}`} onClick={() => update(index, { breaks: h.breaks!.filter((_, n) => n !== i) })}><X size={16} aria-hidden="true" /></Button></div>)}
      <Button variant="ghost" disabled={(h.breaks?.length ?? 0) >= 8} onClick={() => update(index, { breaks: [...(h.breaks ?? []), { open: h.open, close: h.close }] })}><Plus size={15} aria-hidden="true" />{t('hours.addBreak')}</Button>
    </div>}</div>)}{error && <p id={`${id}-error`} className="field-error" role="alert">{t(error)}</p>}</fieldset>;
}
