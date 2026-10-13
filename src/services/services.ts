import type { HttpClient } from './http';
import { apiResource } from './resource';
import type { Service, ServiceInput } from '../types/domain';
export const serviceService = (client: HttpClient) => apiResource<Service, ServiceInput>(client, '/services');
