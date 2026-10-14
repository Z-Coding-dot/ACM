import type { Appointment, AppointmentInput, AppointmentFilters, Customer, CustomerInput, Service, ServiceInput, StaffMember, StaffInput, Session, Business, BusinessInput, Page, Locale } from '../types/domain';
export interface Resource<T, I> { list(businessId: string): Promise<T[]>; get(businessId: string, id: string): Promise<T>; save(businessId: string, input: I, id?: string): Promise<T> }
export interface Api {
  appointments: Resource<Appointment, AppointmentInput> & { search(businessId: string, filters: AppointmentFilters): Promise<Appointment[]>; availability(businessId: string, serviceId: string, staffId: string | null, date: string, excludeId?: string): Promise<string[]>; setStatus(businessId: string, id: string, status: Appointment['status']): Promise<Appointment> };
  customers: Resource<Customer, CustomerInput> & { search(businessId: string, search: string, page: number): Promise<Page<Customer>> };
  services: Resource<Service, ServiceInput>;
  staff: Resource<StaffMember, StaffInput>;
  business: { save(businessId: string, input: Business): Promise<Business>; create(input: BusinessInput): Promise<Session> };
  auth: { login(email: string, password: string, remember?: boolean): Promise<Session>; signup(name: string, email: string, password: string, confirmation: string, locale?: Locale): Promise<Session>; forgotPassword(email: string): Promise<void>; resetPassword(email: string, token: string, password: string, confirmation: string): Promise<void>; resendVerification(): Promise<void>; session(): Promise<Session>; logout(): Promise<void>; updateAccount(name: string, email: string, currentPassword?: string): Promise<Session>; selectBusiness(id: string): Promise<Session> };
}
