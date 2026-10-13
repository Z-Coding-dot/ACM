import { describe, expect, it } from 'vitest';
import { bookingSchema, customerSchema, authSchema, hoursSchema, serviceSchema } from './validation';
describe('workflow validation', () => {
  it('rejects missing booking details and past timestamps', () => {
    expect(bookingSchema.safeParse({ customerId: '', serviceId: '', staffId: '', date: '', startsAt: '', notes: '' }).success).toBe(false);
    expect(bookingSchema.safeParse({ customerId: 'c', serviceId: 's', staffId: 'p', date: '2020-01-01', startsAt: '2020-01-01T09:00:00Z', notes: '' }).success).toBe(false);
  });
  it('rejects invalid contact and auth input with translation keys', () => {
    const result = customerSchema.safeParse({ name: '', email: 'bad', phone: 'x', notes: '' }); expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('validation.required');
    expect(authSchema('signup').safeParse({ name: '', email: 'bad', password: 'short' }).success).toBe(false);
    const numeric = serviceSchema.safeParse({ name: 'Test', description: '', durationMinutes: NaN, price: NaN, currency: 'AFN', active: true });
    expect(numeric.success).toBe(false);
    if (!numeric.success) expect(numeric.error.issues.map(issue => issue.message)).toEqual(['validation.number', 'validation.price']);
  });
  it('rejects reversed working hours', () => { expect(hoursSchema.safeParse([{ day: 1, open: '18:00', close: '09:00', closed: false }]).success).toBe(false); });
});
