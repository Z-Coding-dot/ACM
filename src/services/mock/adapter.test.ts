import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockApi } from './adapter';
import type { Api } from '../contracts';
import { ApiError } from '../errors';
describe('demo adapter contract', () => {
  let api: Api;
  let customerId: string;
  const bid = 'demo-salon';
  beforeEach(async () => { vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-12T00:00:00Z').getTime()); api = createMockApi(0); await api.auth.login('demo@acm.example', 'Demo1234!'); customerId = (await api.customers.save(bid, { name: 'Booking test', email: '', phone: '+93700123456', notes: '' })).id; });
  it('creates, retrieves, edits, and cancels a booking using the shared contract', async () => {
    const slots = await api.appointments.availability(bid, `${bid}-s1`, `${bid}-t1`, '2026-10-13');
    const input = { customerId, serviceId: `${bid}-s1`, staffId: `${bid}-t1`, startsAt: slots[0], status: 'scheduled' as const, notes: 'Scheduling note' };
    const booked = await api.appointments.save(bid, input);
    expect((await api.appointments.get(bid, booked.id)).endsAt).toBe(new Date(new Date(slots[0]).getTime() + 45 * 60000).toISOString());
    expect(await api.appointments.setStatus(bid, booked.id, 'confirmed')).toMatchObject({ status: 'confirmed' });
    expect(await api.appointments.setStatus(bid, booked.id, 'cancelled')).toMatchObject({ status: 'cancelled' });
    expect(await api.appointments.availability(bid, input.serviceId, input.staffId, '2026-10-13')).toContain(slots[0]);
  });
  it('rejects staff and customer overlaps and validates tenant references', async () => {
    const slots = await api.appointments.availability(bid, `${bid}-s1`, `${bid}-t1`, '2026-10-13');
    const input = { customerId, serviceId: `${bid}-s1`, staffId: `${bid}-t1`, startsAt: slots[0], status: 'scheduled' as const, notes: '' };
    await api.appointments.save(bid, input);
    await expect(api.appointments.save(bid, { ...input, customerId: `${bid}-c7` })).rejects.toMatchObject({ status: 409 });
    await expect(api.appointments.save(bid, { ...input, staffId: `${bid}-t2` })).rejects.toMatchObject({ status: 409 });
    await expect(api.customers.get('demo-clinic', `${bid}-c1`)).rejects.toMatchObject({ status: 404 });
    await expect(api.appointments.save(bid, { ...input, customerId: 'demo-clinic-c1' })).rejects.toMatchObject({ status: 404 });
  });
  it('respects business closures, service assignments, inactive staff, and past slots', async () => {
    expect(await api.appointments.availability(bid, `${bid}-s1`, `${bid}-t1`, '2026-10-16')).toEqual([]);
    expect(await api.appointments.availability(bid, `${bid}-s1`, `${bid}-t1`, '2026-10-11')).toEqual([]);
    const person = await api.staff.get(bid, `${bid}-t1`); await api.staff.save(bid, { ...person, active: false }, person.id);
    expect(await api.appointments.availability(bid, `${bid}-s1`, person.id, '2026-10-13')).toEqual([]);
  });
  it('rechecks customer conflicts when only the contact is edited', async () => {
    const other = await api.customers.save(bid, { name: 'Other booking test', email: '', phone: '+93700123456', notes: '' });
    const first = await api.appointments.availability(bid, `${bid}-s1`, `${bid}-t1`, '2026-10-14');
    const second = await api.appointments.availability(bid, `${bid}-s1`, `${bid}-t2`, '2026-10-14');
    const startsAt = first.find(slot => second.includes(slot))!;
    const input = { customerId, serviceId: `${bid}-s1`, staffId: `${bid}-t1`, startsAt, status: 'scheduled' as const, notes: '' };
    await api.appointments.save(bid, input);
    const otherBooking = await api.appointments.save(bid, { ...input, staffId: `${bid}-t2`, customerId: other.id });
    await expect(api.appointments.save(bid, { ...otherBooking, customerId }, otherBooking.id)).rejects.toMatchObject({ status: 409 });
  });
  it('searches and paginates contacts, and keeps separate workspaces', async () => {
    const result = await api.customers.search(bid, 'Sara', 1); expect(result.meta.total).toBe(1); expect(result.data[0].name).toBe('Sara Ahmadi');
    expect((await api.customers.search(bid, '', 2)).data.length).toBe(3);
    const added = await api.customers.save(bid, { name: 'Test contact', email: '', phone: '+93 700 123456', notes: '' });
    expect((await api.customers.list('demo-clinic')).some(c => c.id === added.id)).toBe(false);
  });
  it('never fabricates signup or reset success, blocks offline changes, and clears sessions', async () => {
    await expect(api.auth.signup('Name', 'name@example.com', 'password')).rejects.toBeInstanceOf(ApiError);
    await expect(api.auth.forgotPassword('demo@acm.example')).rejects.toMatchObject({ status: 501 });
    const offline = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(api.customers.save(bid, { name: 'Offline', email: '', phone: '+93700123456', notes: '' })).rejects.toMatchObject({ key: 'error.offline' });
    offline.mockRestore(); await api.auth.logout(); await expect(api.auth.session()).rejects.toMatchObject({ status: 401 });
  });
});
