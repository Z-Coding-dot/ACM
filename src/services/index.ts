import type { Api } from './contracts';
import type { Business } from '../types/domain';
import { http } from './http';
import { appointmentService } from './appointments';
import { customerService } from './customers';
import { serviceService } from './services';
import { staffService } from './staff';
import { authService } from './auth';
export const isDemo = import.meta.env.VITE_API_MODE === 'demo' && (import.meta.env.DEV || import.meta.env.MODE === 'demo');
const live: Api = {
  appointments: appointmentService(http), customers: customerService(http),
  services: serviceService(http), staff: staffService(http), auth: authService(http),
  business: { async save(businessId, body) { return (await http.request<{ data: Business }>('/business', { method: 'PATCH', businessId, body })).data; } },
};
// The development adapter is a separate chunk and is never activated by production mode.
export const api: Api = isDemo ? (await import('./mock/adapter')).createMockApi() : live;
