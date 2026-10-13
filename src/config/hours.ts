import type { BusinessHours } from '../types/domain';
export const defaultHours: BusinessHours[] = Array.from({ length: 7 }, (_, day) => ({ day, open: '09:00', close: '18:00', closed: day === 5 }));
