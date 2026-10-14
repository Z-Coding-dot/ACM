import { describe, expect, it } from 'vitest';
import { dateInZone, zonedTimestamp, addDays, formatMoney, currencyScale } from './dates';
describe('business-local dates and currency', () => {
  it('handles half-hour offsets independently of the host zone', () => {
    expect(zonedTimestamp('2026-10-13', '09:00', 'Asia/Kabul')).toBe('2026-10-13T04:30:00.000Z');
    expect(dateInZone('2026-10-12T22:00:00Z', 'Asia/Kabul')).toBe('2026-10-13');
  });
  it('handles daylight saving and rejects nonexistent times', () => {
    expect(zonedTimestamp('2026-07-15', '09:00', 'America/New_York')).toBe('2026-07-15T13:00:00.000Z');
    expect(() => zonedTimestamp('2026-03-08', '02:30', 'America/New_York')).toThrow();
  });
  it('adds calendar days without host-zone drift and uses currency fraction digits', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(formatMoney(1234, 'USD', 'en')).toBe('$12.34');
    expect(formatMoney(1234, 'JPY', 'en')).toBe('¥1,234');
    expect(currencyScale('AFN')).toBe(100);
    expect(formatMoney(180000, 'AFN', 'en')).toBe('AFN 1,800.00');
  });
});
