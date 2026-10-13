import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '../app/workspace';
import { api } from '../services';
export function useResources() {
  const { business } = useWorkspace();
  const customers = useQuery({ queryKey: [business.id, 'customers'], queryFn: () => api.customers.list(business.id) });
  const services = useQuery({ queryKey: [business.id, 'services'], queryFn: () => api.services.list(business.id) });
  const staff = useQuery({ queryKey: [business.id, 'staff'], queryFn: () => api.staff.list(business.id) });
  const appointments = useQuery({ queryKey: [business.id, 'appointments'], queryFn: () => api.appointments.list(business.id) });
  return { customers: customers.data ?? [], services: services.data ?? [], staff: staff.data ?? [], appointments: appointments.data ?? [], loading: [customers, services, staff, appointments].some(q => q.isPending), error: [customers, services, staff, appointments].find(q => q.error)?.error, retry: () => { void Promise.all([customers.refetch(), services.refetch(), staff.refetch(), appointments.refetch()]); } };
}
