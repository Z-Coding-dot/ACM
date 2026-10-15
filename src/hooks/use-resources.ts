import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '../app/workspace';
import { api } from '../services';
import type { AppointmentFilters } from '../types/domain';
export function useResources(filters: AppointmentFilters = {}, includeAppointments = true) {
  const { business } = useWorkspace();
  const customers = useQuery({ queryKey: [business.id, 'customer-search', '', 1], queryFn: () => api.customers.search(business.id, '', 1) });
  const services = useQuery({ queryKey: [business.id, 'services'], queryFn: () => api.services.list(business.id) });
  const staff = useQuery({ queryKey: [business.id, 'staff'], queryFn: () => api.staff.list(business.id) });
  const appointments = useQuery({ queryKey: [business.id, 'appointments', filters], queryFn: () => api.appointments.search(business.id, filters), enabled: includeAppointments });
  const queries = [customers, services, staff, ...(includeAppointments ? [appointments] : [])];
  return { customers: customers.data?.data ?? [], services: services.data ?? [], staff: staff.data ?? [], appointments: appointments.data ?? [], loading: queries.some(q => q.isPending), error: queries.find(q => q.error)?.error, retry: () => { void Promise.all(queries.map(q => q.refetch())); } };
}
