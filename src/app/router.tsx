import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './workspace';
import { Loading } from '../components/ui/primitives';
import { AppLayout } from '../components/layout/app-layout';
const AuthPage = lazy(() => import('../features/auth/auth-page').then(m => ({ default: m.AuthPage })));
const OverviewPage = lazy(() => import('../features/overview/overview-page').then(m => ({ default: m.OverviewPage })));
const CalendarPage = lazy(() => import('../features/calendar/calendar-page').then(m => ({ default: m.CalendarPage })));
const AppointmentsPage = lazy(() => import('../features/appointments/appointments-page').then(m => ({ default: m.AppointmentsPage })));
const BookingPage = lazy(() => import('../features/appointments/booking-page').then(m => ({ default: m.BookingPage })));
const AppointmentDetailPage = lazy(() => import('../features/appointments/appointment-detail').then(m => ({ default: m.AppointmentDetailPage })));
const CustomersPage = lazy(() => import('../features/customers/customers-page').then(m => ({ default: m.CustomersPage })));
const NewCustomerPage = lazy(() => import('../features/customers/customer-pages').then(m => ({ default: m.NewCustomerPage })));
const CustomerDetailPage = lazy(() => import('../features/customers/customer-pages').then(m => ({ default: m.CustomerDetailPage })));
const ServicesPage = lazy(() => import('../features/services/services-page').then(m => ({ default: m.ServicesPage })));
const StaffPage = lazy(() => import('../features/staff/staff-page').then(m => ({ default: m.StaffPage })));
const SettingsPage = lazy(() => import('../features/settings/settings-page').then(m => ({ default: m.SettingsPage })));
const LandingPage = lazy(() => import('../features/public/landing-page').then(m => ({ default: m.LandingPage })));
const ProductInfoPage = lazy(() => import('../features/public/product-info-page').then(m => ({ default: m.ProductInfoPage })));
import { PwaControls } from '../components/layout/pwa-controls';
import { SystemPage } from '../pages/system-pages';
function ProtectedRoute() {
  const auth = useAuth(); const location = useLocation();
  if (!navigator.onLine) return <Navigate to="/offline" replace />;
  return auth.loading ? <Loading /> : auth.session ? <Outlet /> : <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
}
function RouteEffects() {
  const { pathname } = useLocation(); const { t } = useTranslation();
  useEffect(() => { if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'landing.metaTitle', '/about': 'public.title', '/login': 'auth.login', '/signup': 'auth.signup', '/forgot-password': 'auth.forgot' };
    if (titles[pathname]) document.title = `${t(titles[pathname])} · ${t('app.name')}`;
    const description = t(pathname === '/' ? 'landing.metaDescription' : pathname === '/about' ? 'public.description' : 'app.description');
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    if (titles[pathname]) document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${t(titles[pathname])} · ${t('app.name')}`);
  }, [pathname, t]); return null;
}
export function AppRouter() { const location = useLocation(); return <><RouteEffects /><Suspense fallback={<Loading />}><Routes>
  <Route path="/" element={<LandingPage />} /><Route path="/about" element={<ProductInfoPage />} />
  <Route path="/login" element={<AuthPage key="login" mode="login" />} /><Route path="/signup" element={<AuthPage key="signup" mode="signup" />} /><Route path="/forgot-password" element={<AuthPage key="forgot" mode="forgot-password" />} />
  <Route element={<ProtectedRoute />}><Route path="/app" element={<AppLayout />}><Route index element={<Navigate to="overview" replace />} /><Route path="overview" element={<OverviewPage />} /><Route path="calendar" element={<CalendarPage />} /><Route path="appointments" element={<AppointmentsPage />} /><Route path="appointments/new" element={<BookingPage />} /><Route path="appointments/:id" element={<AppointmentDetailPage />} /><Route path="customers" element={<CustomersPage />} /><Route path="customers/new" element={<NewCustomerPage />} /><Route path="customers/:id" element={<CustomerDetailPage />} /><Route path="services" element={<ServicesPage />} /><Route path="staff" element={<StaffPage />} /><Route path="settings" element={<SettingsPage />} /></Route></Route>
  <Route path="/offline" element={<SystemPage offline />} /><Route path="*" element={<SystemPage />} />
</Routes></Suspense>{!location.pathname.startsWith('/app') && <PwaControls />}</>; }
