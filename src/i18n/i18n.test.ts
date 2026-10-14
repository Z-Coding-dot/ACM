import { describe, expect, it } from 'vitest';
import i18n from './index';
describe('localized display numbers', () => {
  it('formats counts, durations and pagination in Dari without changing semantic counts', async () => {
    await i18n.changeLanguage('fa-AF'); expect(i18n.t('common.page', { page: 2, total: 4 })).toBe('صفحه ۲ از ۴'); expect(i18n.t('common.minutes', { count: 45 })).toBe('۴۵ دقیقه'); await i18n.changeLanguage('en');
  });
  it('keeps English numerals and technical string identifiers intact', async () => {
    await i18n.changeLanguage('en'); expect(i18n.t('common.page', { page: 2, total: 4 })).toBe('Page 2 of 4'); expect(i18n.t('appointment.timezone', { zone: 'Asia/Kabul' })).toContain('Asia/Kabul');
  });
});
