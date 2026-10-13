import type { Business, Customer, Service, StaffMember, Appointment, Industry } from '../../types/domain';
import { industries } from '../../config/industries';
import { todayInZone, addDays, zonedTimestamp } from '../../lib/dates';
import { defaultHours } from '../../config/hours';
const workspaceDefinitions: { id: string; name: string; industry: Industry; services: [string, string, number, number][] }[] = [
  { id: 'demo-salon', name: 'Olive Studio', industry: 'salon', services: [['Haircut & styling', 'A tailored cut and finish.', 45, 180000], ['Beard grooming', 'Shape, trim and finish.', 30, 90000], ['Colour consultation', 'Plan your next colour treatment.', 30, 75000]] },
  { id: 'demo-clinic', name: 'Mehr Health Center', industry: 'clinic', services: [['General appointment', 'A scheduled visit with a practitioner.', 30, 120000], ['Follow-up appointment', 'A scheduled follow-up visit.', 30, 80000], ['Initial appointment', 'Your first scheduled visit.', 60, 180000]] },
  { id: 'demo-education', name: 'Bright Learning', industry: 'education', services: [['English tutoring', 'An individual language session.', 60, 90000], ['Mathematics tutoring', 'An individual mathematics session.', 60, 90000], ['Study planning', 'Plan the next learning sessions.', 30, 50000]] },
  { id: 'demo-consulting', name: 'North Advisory', industry: 'consulting', services: [['Discovery meeting', 'Discuss your project needs.', 30, 100000], ['Planning session', 'Review priorities and next steps.', 60, 250000], ['Project review', 'Review progress together.', 45, 200000]] },
  { id: 'demo-other', name: 'Everyday Services', industry: 'other', services: [['Standard appointment', 'An individual service appointment.', 45, 100000], ['Extended appointment', 'Additional time for your service.', 60, 150000], ['Introduction', 'Discuss the service you need.', 30, 50000]] },
];
export function createFixtures() {
  const businesses: Business[] = workspaceDefinitions.map(w => ({ id: w.id, name: w.name, industry: w.industry, email: `hello@${w.id}.example`, phone: '+93 700 123 456', timeZone: 'Asia/Kabul', currency: 'AFN', locale: 'en', hours: structuredClone(defaultHours), appointmentSettings: { ...industries[w.industry].defaults } }));
  const customers: Customer[] = [], services: Service[] = [], staff: StaffMember[] = [], appointments: Appointment[] = [];
  for (const w of workspaceDefinitions) {
    const today = todayInZone('Asia/Kabul');
    const names = ['Sara Ahmadi', 'Omar Rahimi', 'Laila Amiri', 'Farid Noori', 'Maryam Azizi', 'Ali Karimi', 'Nadia Rahman', 'Yusuf Salimi'];
    names.forEach((name, i) => customers.push({ id: `${w.id}-c${i + 1}`, businessId: w.id, name, email: `${name.toLowerCase().replace(' ', '.')}@example.com`, phone: `+93 700 120 ${String(100 + i)}`, notes: '', createdAt: zonedTimestamp(addDays(today, -i), '08:00', 'Asia/Kabul') }));
    w.services.forEach(([name, description, durationMinutes, priceMinor], i) => services.push({ id: `${w.id}-s${i + 1}`, businessId: w.id, name, description, durationMinutes, priceMinor, currency: 'AFN', active: true }));
    ['Zahra Mohammadi', 'Arman Safi', 'Hana Akbari'].forEach((name, i) => staff.push({ id: `${w.id}-t${i + 1}`, businessId: w.id, name, email: `team${i + 1}@${w.id}.example`, phone: '+93 700 234 567', active: true, serviceIds: services.filter(s => s.businessId === w.id).map(s => s.id), hours: structuredClone(defaultHours) }));
    for (let i = 0; i < 12; i++) {
      const offset = i < 6 ? 0 : i < 9 ? 1 : -1;
      const service = services.find(s => s.id === `${w.id}-s${i % 3 + 1}`)!;
      const startsAt = zonedTimestamp(addDays(today, offset), `${String(9 + i % 6).padStart(2, '0')}:00`, 'Asia/Kabul');
      appointments.push({ id: `${w.id}-a${i + 1}`, businessId: w.id, customerId: `${w.id}-c${i % 8 + 1}`, serviceId: service.id, staffId: `${w.id}-t${i % 3 + 1}`, startsAt, endsAt: new Date(new Date(startsAt).getTime() + service.durationMinutes * 60000).toISOString(), status: offset < 0 ? (i === 11 ? 'no-show' : 'completed') : i === 5 ? 'cancelled' : i % 2 ? 'scheduled' : 'confirmed', notes: '' });
    }
  }
  return { businesses, customers, services, staff, appointments };
}
