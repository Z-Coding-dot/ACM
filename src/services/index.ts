import type { Api } from './contracts';
import type { Business, Session } from '../types/domain';
import { http } from './http';
import { appointmentService } from './appointments';
import { customerService } from './customers';
import { serviceService } from './services';
import { staffService } from './staff';
import { authService } from './auth';
export const isDemo = false;
const live: Api = {
  appointments: appointmentService(http), customers: customerService(http),
  services: serviceService(http), staff: staffService(http), auth: authService(http),
  business: { async save(businessId, body) { return (await http.request<{ data: Business }>('/business', { method: 'PATCH', businessId, body })).data; }, async create(body) { await http.csrf(); return http.request<Session>('/businesses', { method: 'POST', body }); } },
};
export const api: Api = live;
