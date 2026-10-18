import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { m, useReducedMotion } from 'framer-motion';
import { LayoutDashboard, Building2, UsersRound, ChartNoAxesCombined, FilePenLine, Activity, LogOut, ArrowLeft, ShieldCheck, Menu, UserRound } from 'lucide-react';
import { useAuth } from '../../app/workspace';
import { BrandMark } from '../../components/ui/brand';
import { Button, Dialog, ErrorState } from '../../components/ui/primitives';
import { LanguageDropdown } from '../../components/ui/language-dropdown';
import { uiSpring } from '../../lib/motion';
import './platform.css';

const navigation = [
  { path: '/platform', label: 'platform.overview', icon: LayoutDashboard },
  { path: '/platform/businesses', label: 'platform.businesses', icon: Building2 },
  { path: '/platform/users', label: 'platform.users', icon: UsersRound },
  { path: '/platform/analytics', label: 'platform.analytics', icon: ChartNoAxesCombined },
  { path: '/platform/content', label: 'platform.content', icon: FilePenLine },
  { path: '/platform/activity', label: 'platform.activity', icon: Activity },
  { path: '/platform/account', label: 'account.settings', icon: UserRound },
];
export function PlatformLayout() {
  const { t } = useTranslation(), auth = useAuth(), navigate = useNavigate(), location = useLocation(), reduced = useReducedMotion();
  const [open, setOpen] = useState(false), [error, setError] = useState<unknown>(null);
  const current = navigation.find(item => item.path === location.pathname) || navigation[0];
  useEffect(() => { document.title = `${t(current.label)} · ${t('app.name')}`; }, [current.label, t]);
  return <div className={`platform-layout ${open ? 'platform-menu-open' : ''}`}>
    <a className="skip-link" href="#main-content">{t('nav.skip')}</a>
    <m.aside className="platform-sidebar" initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={uiSpring}>
      <Link className="brand" to="/platform"><BrandMark size={38} /><span>{t('app.name')}</span></Link>
      <div className="platform-scope"><ShieldCheck size={17} aria-hidden="true" /><span>{t('platform.scope')}</span></div>
      <nav aria-label={t('platform.title')}>{navigation.map((item, index) => <m.div key={item.path} initial={{ x: reduced ? 0 : -8, opacity: reduced ? 1 : 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...uiSpring, delay: reduced ? 0 : index * .025 }}><NavLink to={item.path} end={item.path === '/platform'} onClick={() => setOpen(false)}><item.icon size={19} aria-hidden="true" /><span>{t(item.label)}</span></NavLink></m.div>)}</nav>
      <div className="platform-sidebar-footer"><Link to={auth.session?.activeBusinessId ? '/app/overview' : '/'}><ArrowLeft size={17} className="directional" aria-hidden="true" />{t(auth.session?.activeBusinessId ? 'platform.businessWorkspace' : 'landing.backHome')}</Link><small>{t('platform.separateAccess')}</small></div>
    </m.aside>
    <div className="platform-shell"><header className="platform-header"><div className="inline-icon"><Button className="platform-menu-button" variant="ghost" aria-label={t('landing.menu')} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}><Menu size={20} /></Button><span>{t(current.label)}</span></div><div className="inline-icon"><LanguageDropdown /><Link className="platform-current-user" to="/platform/account">{auth.session!.user.name}</Link><Button variant="ghost" aria-label={t('auth.signout')} onClick={() => void auth.logout().then(() => navigate('/login')).catch(setError)}><LogOut size={18} /></Button></div></header>
      <m.main className="platform-main" id="main-content" tabIndex={-1} key={location.pathname} initial={{ y: reduced ? 0 : 8, opacity: reduced ? 1 : 0 }} animate={{ y: 0, opacity: 1 }} transition={uiSpring}>{!!error && <ErrorState error={error} />}<Outlet /></m.main>
    </div>
    {open && <Dialog title={t('platform.title')} className="navigation-dialog" onClose={() => setOpen(false)}><nav className="more-navigation" aria-label={t('platform.title')}>{navigation.map(item => <NavLink key={item.path} to={item.path} end={item.path === '/platform'} onClick={() => setOpen(false)}><item.icon size={19} aria-hidden="true" /><span>{t(item.label)}</span></NavLink>)}</nav></Dialog>}
  </div>;
}
