export type Locale = 'en' | 'fa-AF';
export type Industry = 'salon' | 'clinic' | 'education' | 'consulting' | 'other';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
export const statuses: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
export interface BusinessHours { day: number; open: string; close: string; closed: boolean }
export interface Business {
  id: string; name: string; industry: Industry; email: string; phone: string;
  timeZone: string; currency: string; locale: Locale; hours: BusinessHours[];
  appointmentSettings: { slotMinutes: number; allowUnassigned: boolean; requireConfirmation: boolean };
}
export interface User { id: string; name: string; email: string; businessId: string }
export interface Customer { id: string; businessId: string; name: string; email: string; phone: string; notes: string; createdAt: string }
export interface Service { id: string; businessId: string; name: string; description: string; durationMinutes: number; priceMinor: number; currency: string; active: boolean }
export interface StaffAvailability { staffId: string; businessId: string; hours: BusinessHours[] }
export interface StaffMember { id: string; businessId: string; name: string; email: string; phone: string; serviceIds: string[]; hours: BusinessHours[]; active: boolean }
export interface Appointment { id: string; businessId: string; customerId: string; serviceId: string; staffId: string | null; startsAt: string; endsAt: string; status: AppointmentStatus; notes: string }
export type CustomerInput = Omit<Customer, 'id' | 'businessId' | 'createdAt'>;
export type ServiceInput = Omit<Service, 'id' | 'businessId'>;
export type StaffInput = Omit<StaffMember, 'id' | 'businessId'>;
export type AppointmentInput = Omit<Appointment, 'id' | 'businessId' | 'endsAt'>;
export interface Session { user: User; businesses: Business[]; activeBusinessId: string }
export interface Page<T> { data: T[]; meta: { currentPage: number; perPage: number; total: number; lastPage: number } }
export interface AppointmentFilters { search?: string; from?: string; to?: string; status?: string; staffId?: string }
