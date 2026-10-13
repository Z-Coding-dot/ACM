import { LayoutDashboard, CalendarDays, CalendarCheck2, Users, BriefcaseBusiness, UserRound, Settings } from 'lucide-react';
export type NavigationId = 'overview' | 'calendar' | 'appointments' | 'customers' | 'services' | 'staff' | 'settings';
export const navigation = [
  { id: 'overview', href: '/app/overview', label: 'nav.overview', icon: LayoutDashboard, mobile: true },
  { id: 'calendar', href: '/app/calendar', label: 'nav.calendar', icon: CalendarDays, mobile: true },
  { id: 'appointments', href: '/app/appointments', label: 'nav.appointments', icon: CalendarCheck2, mobile: true },
  { id: 'customers', href: '/app/customers', label: 'terms.customers', icon: Users, mobile: true },
  { id: 'services', href: '/app/services', label: 'terms.services', icon: BriefcaseBusiness, mobile: false },
  { id: 'staff', href: '/app/staff', label: 'terms.staff', icon: UserRound, mobile: false },
  { id: 'settings', href: '/app/settings', label: 'nav.settings', icon: Settings, mobile: false },
] as const;
