import type { HttpClient } from './http';
import { apiResource } from './resource';
import type { StaffMember, StaffInput } from '../types/domain';
export const staffService = (client: HttpClient) => apiResource<StaffMember, StaffInput>(client, '/staff');
