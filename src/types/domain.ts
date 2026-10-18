export type Locale = 'en' | 'fa-AF';
export type Industry = 'salon' | 'clinic' | 'education' | 'consulting' | 'other';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
export const statuses: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
export interface BusinessHours { day: number; open: string; close: string; closed: boolean; breaks?: { open: string; close: string }[] }
export interface Business {
  id: string; name: string; industry: Industry; email: string; phone: string;
  timeZone: string; currency: string; locale: Locale; hours: BusinessHours[];
  appointmentSettings: { slotMinutes: number; allowUnassigned: boolean; requireConfirmation: boolean };
  role?: 'owner' | 'administrator' | 'receptionist' | 'staff'; permissions?: string[];
  logoUrl?: string | null; suspended?: boolean;
}
export type BusinessInput = Omit<Business, 'id' | 'role' | 'permissions'>;
export interface User { id: string; name: string; email: string; businessId: string | null; emailVerified?: boolean; hasPassword?: boolean; locale?: Locale; platformAdmin?: boolean }
export interface Customer { id: string; businessId: string; name: string; email: string; phone: string; notes: string; createdAt: string; active?: boolean }
export interface Service { id: string; businessId: string; name: string; description: string; durationMinutes: number; priceMinor: number; currency: string; active: boolean }
export interface StaffAvailability { staffId: string; businessId: string; hours: BusinessHours[] }
export interface StaffMember { id: string; businessId: string; name: string; email: string; phone: string; serviceIds: string[]; hours: BusinessHours[]; active: boolean; userId?: string | null }
export interface Membership { id: string; userId: string; name: string; email: string; role: 'owner' | 'administrator' | 'receptionist' | 'staff'; emailVerified?: boolean }
export interface Appointment { id: string; businessId: string; customerId: string; serviceId: string; staffId: string | null; startsAt: string; endsAt: string; status: AppointmentStatus; notes: string; customerName?: string; serviceName?: string; staffName?: string | null; durationMinutes?: number; priceMinor?: number; currency?: string }
export interface Dashboard { date: string; daily: Appointment[]; upcoming: Appointment[]; statusCounts: Partial<Record<AppointmentStatus, number>>; customerTotal: number; recentCustomers: Customer[] }
export type CustomerInput = Pick<Customer, 'name' | 'email' | 'phone' | 'notes'>;
export type ServiceInput = Omit<Service, 'id' | 'businessId'>;
export type StaffInput = Omit<StaffMember, 'id' | 'businessId'>;
export type AppointmentInput = Pick<Appointment, 'customerId' | 'serviceId' | 'staffId' | 'startsAt' | 'status' | 'notes'>;
export interface Session { user: User; businesses: Business[]; activeBusinessId: string | null; verificationEmailSent?: boolean }
export interface Page<T> { data: T[]; meta: { currentPage: number; perPage: number; total: number; lastPage: number } }
export interface AppointmentFilters { search?: string; from?: string; to?: string; status?: string; staffId?: string; customerId?: string }
