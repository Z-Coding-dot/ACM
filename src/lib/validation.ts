import { z } from 'zod';
import { minutes } from './dates';
const required = z.string().trim().min(1, 'validation.required').max(160, 'validation.maxLength');
const email = z.string().trim().email('validation.email');
const phone = z.string().trim().regex(/^[+\d][\d\s().-]{6,24}$/, 'validation.phone');
export const customerSchema = z.object({ name: required, email: z.union([email, z.literal('')]), phone, notes: z.string().max(2000, 'validation.maxLength') });
export const authSchema = (mode: string) => z.object({ name: mode === 'signup' ? required : z.string(), email, password: mode === 'forgot-password' ? z.string() : z.string().min(8, 'validation.password').max(72, 'validation.maxLength'), confirmation: z.string() }).refine(values => !['signup', 'reset-password'].includes(mode) || values.password === values.confirmation, { message: 'validation.passwordMatch', path: ['confirmation'] });
export const hoursSchema = z.array(z.object({ day: z.number(), open: z.string(), close: z.string(), closed: z.boolean() }).refine(h => h.closed || (/^([01]\d|2[0-3]):[0-5]\d$/.test(h.open) && /^([01]\d|2[0-3]):[0-5]\d$/.test(h.close) && minutes(h.close) > minutes(h.open)), { message: 'validation.hours', path: ['close'] }));
export const serviceSchema = z.object({ name: required, description: z.string().max(2000, 'validation.maxLength'), durationMinutes: z.number({ error: 'validation.number' }).int('validation.number').min(5, 'validation.number').max(480, 'validation.number'), price: z.number({ error: 'validation.price' }).min(0, 'validation.price').max(10000000, 'validation.price'), currency: z.enum(['AFN', 'USD', 'EUR', 'GBP', 'AED', 'INR', 'PKR', 'JPY'], { error: 'validation.currency' }), active: z.boolean() });
export const staffSchema = z.object({ name: required, email, phone, active: z.boolean(), serviceIds: z.array(z.string()), hours: hoursSchema });
export const bookingSchema = z.object({ customerId: required, serviceId: required, staffId: z.string(), date: required, startsAt: z.string().min(1, 'validation.required').refine(value => !value || new Date(value).getTime() > Date.now(), 'validation.future'), notes: z.string().max(2000, 'validation.maxLength') });
export const businessSchema = z.object({
  name: required, email: z.union([email, z.literal('')]), phone: z.union([phone, z.literal('')]), industry: z.enum(['salon', 'clinic', 'education', 'consulting', 'other']),
  timeZone: z.string().refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'validation.timezone'),
  currency: z.enum(['AFN', 'USD', 'EUR', 'GBP', 'AED', 'INR', 'PKR', 'JPY'], { error: 'validation.currency' }), locale: z.enum(['en', 'fa-AF']), hours: hoursSchema,
  appointmentSettings: z.object({ slotMinutes: z.number({ error: 'validation.number' }).int('validation.number').min(5, 'validation.number').max(60, 'validation.number'), allowUnassigned: z.boolean(), requireConfirmation: z.boolean() }),
});
