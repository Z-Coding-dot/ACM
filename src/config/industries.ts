import type { Industry } from '../types/domain';
import type { NavigationId } from './navigation';
export interface IndustryConfiguration {
  label: string; customerLabel: string; staffLabel: string; serviceLabel: string;
  guidance: string; empty: string; enabledNavigation: NavigationId[];
  serviceFields: ('description' | 'durationMinutes' | 'priceMinor')[];
  features: { staffAssignment: boolean; customerNotes: boolean };
  defaults: { slotMinutes: number; allowUnassigned: boolean; requireConfirmation: boolean };
}
const shared = {
  enabledNavigation: ['overview', 'calendar', 'appointments', 'customers', 'services', 'staff', 'settings'] as NavigationId[],
  serviceFields: ['description', 'durationMinutes', 'priceMinor'] as IndustryConfiguration['serviceFields'],
  features: { staffAssignment: true, customerNotes: true },
};
export const industries: Record<Industry, IndustryConfiguration> = {
  salon: { ...shared, label: 'industry.salon', customerLabel: 'terms.customers', staffLabel: 'terms.stylists', serviceLabel: 'terms.services', guidance: 'guidance.salon', empty: 'empty.salon', defaults: { slotMinutes: 15, allowUnassigned: false, requireConfirmation: true } },
  clinic: { ...shared, label: 'industry.clinic', customerLabel: 'terms.patients', staffLabel: 'terms.practitioners', serviceLabel: 'terms.services', guidance: 'guidance.clinic', empty: 'empty.clinic', features: { staffAssignment: true, customerNotes: false }, defaults: { slotMinutes: 30, allowUnassigned: false, requireConfirmation: true } },
  education: { ...shared, label: 'industry.education', customerLabel: 'terms.students', staffLabel: 'terms.instructors', serviceLabel: 'terms.sessions', guidance: 'guidance.education', empty: 'empty.education', defaults: { slotMinutes: 30, allowUnassigned: false, requireConfirmation: false } },
  consulting: { ...shared, label: 'industry.consulting', customerLabel: 'terms.clients', staffLabel: 'terms.consultants', serviceLabel: 'terms.services', guidance: 'guidance.consulting', empty: 'empty.consulting', defaults: { slotMinutes: 30, allowUnassigned: true, requireConfirmation: false } },
  other: { ...shared, label: 'industry.other', customerLabel: 'terms.customers', staffLabel: 'terms.staff', serviceLabel: 'terms.services', guidance: 'guidance.other', empty: 'empty.other', defaults: { slotMinutes: 30, allowUnassigned: true, requireConfirmation: false } },
};
