import type { Locale } from '../types/domain';
const zoneFormatters = new Map<string, Intl.DateTimeFormat>();
function zoneFormatter(timeZone: string, clock = false) {
  const key = `${timeZone}:${clock}`;
  if (!zoneFormatters.has(key)) zoneFormatters.set(key, new Intl.DateTimeFormat(clock ? 'en-GB' : 'en-CA', clock ? { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }));
  return zoneFormatters.get(key)!;
}
// All calendar arithmetic uses business-local ISO dates, never the browser's local zone.
export function dateInZone(date: Date | string, timeZone: string): string {
  const parts = zoneFormatter(timeZone).formatToParts(new Date(date));
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)?.value).join('-');
}
export const todayInZone = (timeZone: string) => dateInZone(new Date(), timeZone);
export function addDays(date: string, count: number) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + count); return d.toISOString().slice(0, 10); }
export function dayOfWeek(date: string) { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
export function timeInZone(date: string, timeZone: string) { return zoneFormatter(timeZone, true).format(new Date(date)); }
export function zonedTimestamp(date: string, time: string, timeZone: string): string {
  const target = new Date(`${date}T${time}:00Z`).getTime();
  let guess = target;
  for (let i = 0; i < 4; i++) {
    const observedDate = dateInZone(new Date(guess), timeZone);
    const observedTime = timeInZone(new Date(guess).toISOString(), timeZone);
    const observed = new Date(`${observedDate}T${observedTime}:00Z`).getTime();
    if (observed === target) break;
    guess += target - observed;
  }
  const result = new Date(guess).toISOString();
  if (dateInZone(result, timeZone) !== date || timeInZone(result, timeZone) !== time) throw new Error('error.invalidTime');
  return result;
}
export function formatDate(date: string, locale: Locale, timeZone: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { calendar: 'gregory', timeZone, year: 'numeric', month: 'short', day: 'numeric', ...options }).format(new Date(date.length === 10 ? zonedTimestamp(date, '12:00', timeZone) : date));
}
export function formatTime(date: string, locale: Locale, timeZone: string) { return new Intl.DateTimeFormat(locale, { timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(date)); }
export function formatMoney(minor: number, currency: string, locale: Locale) {
  const digits = Math.log10(currencyScale(currency));
  const fmt = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits });
  return fmt.format(minor / currencyScale(currency));
}
// ISO 4217 minor units are independent of CLDR display rounding (notably AFN).
const currencyDigits: Record<string, number> = { AFN: 2, USD: 2, EUR: 2, GBP: 2, AED: 2, INR: 2, PKR: 2, JPY: 0 };
export function currencyScale(currency: string) { return 10 ** (currencyDigits[currency] ?? (new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2)); }
export function minutes(time: string) { const [h, m] = time.split(':').map(Number); return h * 60 + m; }
export function clockTime(value: number) { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
