import type { Appointment, AppointmentInput, AppointmentFilters, Customer, CustomerInput, Service, ServiceInput, StaffMember, StaffInput, Session, Business, Page } from '../types/domain';
export interface Resource<T, I> { list(businessId: string): Promise<T[]>; get(businessId: string, id: string): Promise<T>; save(businessId: string, input: I, id?: string): Promise<T> }
export interface Api {
  appointments: Resource<Appointment, AppointmentInput> & { search(businessId: string, filters: AppointmentFilters): Promise<Appointment[]>; availability(businessId: string, serviceId: string, staffId: string | null, date: string, excludeId?: string): Promise<string[]>; setStatus(businessId: string, id: string, status: Appointment['status']): Promise<Appointment> };
  customers: Resource<Customer, CustomerInput> & { search(businessId: string, search: string, page: number): Promise<Page<Customer>> };
  services: Resource<Service, ServiceInput>;
  staff: Resource<StaffMember, StaffInput>;
  business: { save(businessId: string, input: Business): Promise<Business> };
  auth: { login(email: string, password: string, remember?: boolean): Promise<Session>; signup(name: string, email: string, password: string): Promise<void>; forgotPassword(email: string): Promise<void>; session(): Promise<Session>; logout(): Promise<void>; updateAccount(name: string, email: string): Promise<void> };
}
