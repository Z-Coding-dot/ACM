import type { Api, Resource } from '../services/contracts';
import type { Business, Customer, CustomerInput, Service, ServiceInput, StaffMember, StaffInput, Appointment, AppointmentInput, Session } from '../types/domain';
import { ApiError } from '../services/errors';
import { createFixtures } from './fixtures';
import { dateInZone, dayOfWeek, minutes, clockTime, zonedTimestamp } from '../lib/dates';

export function createMockApi(delay = 180): Api {
  const db: ReturnType<typeof createFixtures> = { businesses: [], customers: [], services: [], staff: [], appointments: [] };
  function initializeFixtures() {
    if (db.businesses.length) return;
    const fixtures = createFixtures();
    db.businesses.push(...fixtures.businesses); db.customers.push(...fixtures.customers); db.services.push(...fixtures.services); db.staff.push(...fixtures.staff); db.appointments.push(...fixtures.appointments);
  }
  let session: Session | null = null;
  const pause = async () => { await new Promise(resolve => setTimeout(resolve, delay)); if (typeof navigator !== 'undefined' && !navigator.onLine) throw new ApiError('error.offline', 0); };
  const business = (id: string) => { const b = db.businesses.find(b => b.id === id); if (!b) throw new ApiError('error.notFound', 404); return b; };
  const tenant = (id: string) => { business(id); if (!session) throw new ApiError('error.unauthenticated', 401); if (!session.businesses.some(b => b.id === id)) throw new ApiError('error.forbidden', 403); };
  const get = <T extends { id: string; businessId: string }>(rows: T[], bid: string, id: string) => { tenant(bid); const row = rows.find(r => r.id === id && r.businessId === bid); if (!row) throw new ApiError('error.notFound', 404); return row; };
  function resource<T extends { id: string; businessId: string }, I>(rows: T[], defaults: () => object = () => ({})): Resource<T, I> {
    return {
      async list(bid) { await pause(); tenant(bid); return structuredClone(rows.filter(r => r.businessId === bid)); },
      async get(bid, id) { await pause(); return structuredClone(get(rows, bid, id)); },
      async save(bid, input, id) { await pause(); tenant(bid); const row = id ? get(rows, bid, id) : { ...defaults(), id: crypto.randomUUID(), businessId: bid } as T; Object.assign(row, input, { id: row.id, businessId: bid }); if (!id) rows.push(row); return structuredClone(row); },
      async archive() { throw new ApiError('error.generic', 501); },
    };
  }
  const appointments = resource<Appointment, AppointmentInput>(db.appointments);
  // Development availability only. Laravel will be the authority for atomic conflict checks.
  function available(bid: string, sid: string, staffId: string | null, date: string, exclude?: string) {
    tenant(bid);
    const b = business(bid), s = get(db.services, bid, sid);
    if (!s.active) return [];
    if (!staffId && !b.appointmentSettings.allowUnassigned) return [];
    const person = staffId ? get(db.staff, bid, staffId) : null;
    if (person && (!person.active || !person.serviceIds.includes(sid))) return [];
    const hours = b.hours.find(h => h.day === dayOfWeek(date));
    const staffHours = person?.hours.find(h => h.day === dayOfWeek(date));
    if (!hours || hours.closed || (person && (!staffHours || staffHours.closed))) return [];
    const start = Math.max(minutes(hours.open), staffHours ? minutes(staffHours.open) : 0);
    const end = Math.min(minutes(hours.close), staffHours ? minutes(staffHours.close) : 1440);
    const result: string[] = [];
    for (let n = start; n + s.durationMinutes <= end; n += b.appointmentSettings.slotMinutes) {
      let ts: string;
      try { ts = zonedTimestamp(date, clockTime(n), b.timeZone); } catch { continue; }
      const from = new Date(ts).getTime(), to = from + s.durationMinutes * 60000;
      if (from <= Date.now()) continue;
      if (db.appointments.some(a => a.businessId === bid && a.id !== exclude && a.staffId === staffId && !['cancelled', 'no-show'].includes(a.status) && new Date(a.startsAt).getTime() < to && new Date(a.endsAt).getTime() > from)) continue;
      result.push(ts);
    }
    return result;
  }
  return {
    memberships: { async list() { return []; }, async add() { throw new ApiError('error.generic', 501); }, async setRole() { throw new ApiError('error.generic', 501); }, async remove() { throw new ApiError('error.generic', 501); } },
    async dashboard() { throw new ApiError('error.generic', 501); },
    appointments: {
      ...appointments,
      async page() { throw new ApiError('error.generic', 501); },
      async search(bid, f) { const b = business(bid); const all = await appointments.list(bid); return all.filter(a => (!f.status || a.status === f.status) && (!f.staffId || a.staffId === f.staffId) && (!f.from || dateInZone(a.startsAt, b.timeZone) >= f.from) && (!f.to || dateInZone(a.startsAt, b.timeZone) <= f.to) && (!f.search || [get(db.customers, bid, a.customerId).name, get(db.services, bid, a.serviceId).name].join(' ').toLowerCase().includes(f.search.toLowerCase()))).sort((a, b) => a.startsAt.localeCompare(b.startsAt)); },
      async availability(bid, sid, staffId, date, exclude) { await pause(); return available(bid, sid, staffId, date, exclude); },
      async save(bid, input, id) {
        await pause(); tenant(bid); get(db.customers, bid, input.customerId);
        const b = business(bid), s = get(db.services, bid, input.serviceId);
        const previous = id ? get(db.appointments, bid, id) : null;
        const changed = !previous || ['startsAt', 'serviceId', 'staffId', 'customerId'].some(k => previous[k as keyof Appointment] !== input[k as keyof AppointmentInput]);
        if (changed && !available(bid, input.serviceId, input.staffId, dateInZone(input.startsAt, b.timeZone), id).includes(input.startsAt)) throw new ApiError('error.conflict', 409);
        const endsAt = new Date(new Date(input.startsAt).getTime() + s.durationMinutes * 60000).toISOString();
        const overlappingCustomer = db.appointments.some(a => a.businessId === bid && a.id !== id && a.customerId === input.customerId && !['cancelled', 'no-show'].includes(a.status) && a.startsAt < endsAt && a.endsAt > input.startsAt);
        if (changed && overlappingCustomer) throw new ApiError('error.conflict', 409);
        // Keep the checked write synchronous so simultaneous demo submissions cannot interleave.
        const row: Appointment = previous ?? { ...input, id: crypto.randomUUID(), businessId: bid, endsAt };
        Object.assign(row, input, { id: row.id, businessId: bid, endsAt });
        if (!previous) db.appointments.push(row);
        return structuredClone(row);
      },
      async setStatus(bid, id, status) { await pause(); const row = get(db.appointments, bid, id); if (row.status === 'cancelled') throw new ApiError('error.cancelled', 422); row.status = status; return structuredClone(row); },
    },
    customers: {
      ...resource<Customer, CustomerInput>(db.customers, () => ({ createdAt: new Date().toISOString() })),
      async search(bid, search, page) { await pause(); tenant(bid); const rows = db.customers.filter(c => c.businessId === bid && `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return { data: structuredClone(rows.slice((page - 1) * 6, page * 6)), meta: { currentPage: page, perPage: 6, total: rows.length, lastPage: Math.max(1, Math.ceil(rows.length / 6)) } }; },
    },
    services: resource<Service, ServiceInput>(db.services), staff: resource<StaffMember, StaffInput>(db.staff),
    business: { async save(bid: string, input: Business) { await pause(); tenant(bid); const b = business(bid); Object.assign(b, structuredClone(input), { id: bid }); if (session) session.businesses = structuredClone(db.businesses); return structuredClone(b); }, async create() { throw new ApiError('error.generic', 501); } },
    auth: {
      async login(email, password) { await pause(); if (email !== 'demo@acm.example' || password !== 'Demo1234!') throw new ApiError('error.credentials', 401); initializeFixtures(); session = { user: { id: 'demo-user', name: 'Zia Parsa', email, businessId: db.businesses[0].id }, businesses: structuredClone(db.businesses), activeBusinessId: db.businesses[0].id }; return structuredClone(session); },
      async signup() { await pause(); throw new ApiError('auth.signupUnavailable', 501); },
      async forgotPassword() { await pause(); throw new ApiError('auth.resetUnavailable', 501); },
      async session() { await pause(); if (!session) throw new ApiError('error.unauthenticated', 401); return structuredClone(session); },
      async logout() { await pause(); session = null; },
      async updateAccount(name, email) { await pause(); if (!session) throw new ApiError('error.unauthenticated', 401); session.user = { ...session.user, name, email }; return structuredClone(session); },
      async resetPassword() { throw new ApiError('error.generic', 501); },
      async resendVerification() { throw new ApiError('error.generic', 501); },
      async selectBusiness(id) { tenant(id); session!.activeBusinessId = id; return structuredClone(session!); },
    },
  };
}
