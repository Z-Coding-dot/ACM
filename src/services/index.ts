import type { Api } from './contracts';
import type { Business, Session, Dashboard, Membership } from '../types/domain';
import { http } from './http';
import { appointmentService } from './appointments';
import { customerService } from './customers';
import { serviceService } from './services';
import { staffService } from './staff';
import { authService } from './auth';
const live: Api = {
  appointments: appointmentService(http), customers: customerService(http),
  services: serviceService(http), staff: staffService(http), auth: authService(http),
  dashboard: async businessId => (await http.request<{ data: Dashboard }>('/dashboard', { businessId })).data,
  memberships: {
    list: async businessId => (await http.request<{ data: Membership[] }>('/memberships', { businessId })).data,
    async add(businessId, email, role) { await http.csrf(); return (await http.request<{ data: Membership }>('/memberships', { method: 'POST', businessId, body: { email, role } })).data; },
    async setRole(businessId, id, role) { await http.csrf(); return (await http.request<{ data: Membership }>(`/memberships/${encodeURIComponent(id)}`, { method: 'PATCH', businessId, body: { role } })).data; },
    async remove(businessId, id) { await http.csrf(); await http.request<void>(`/memberships/${encodeURIComponent(id)}`, { method: 'DELETE', businessId }); },
  },
  business: { async save(businessId, body) { await http.csrf(); return (await http.request<{ data: Business }>('/business', { method: 'PATCH', businessId, body })).data; }, async create(body) { await http.csrf(); return http.request<Session>('/businesses', { method: 'POST', body }); } },
};
export const api: Api = live;
