import { useState, useEffect } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,ChevronDown,LogOut,Settings,Plus, WifiOff,
} from "lucide-react";
import { navigation } from "../../config/navigation";
import { useWorkspace } from "../../app/workspace";
import { Button, Dialog, ErrorState } from "../ui/primitives";
import { LanguageDropdown } from "../ui/language-dropdown";
import { PwaControls } from "./pwa-controls";
import { BrandMark } from "../ui/brand";
import { motion, useReducedMotion } from "framer-motion";
import { uiSpring } from "../../lib/motion";

export function AppLayout() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false),
    [more, setMore] = useState(false),
    [account, setAccount] = useState(false),
    [error, setError] = useState<unknown>(null);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const nav = navigation.filter((item) =>
    workspace.industry.enabledNavigation.includes(item.id),
  );
  const label = (id: string, key: string) =>
    t(
      id === "customers"
        ? workspace.industry.customerLabel
        : id === "staff"
          ? workspace.industry.staffLabel
          : id === "services"
            ? workspace.industry.serviceLabel
            : key,
    );
  const current = nav.find((item) => location.pathname.startsWith(item.href));
  const title = current ? label(current.id, current.label) : t("app.name");
  useEffect(() => {
    document.title = `${title} · ${t("app.name")}`;
  }, [title, t]);
  function renderLink(item: (typeof nav)[number]) {
    return (
      <NavLink
        key={item.id}
        to={item.href}
        aria-label={label(item.id, item.label)}
        title={label(item.id, item.label)}
        onClick={() => setMore(false)}
      >
        <item.icon size={19} aria-hidden="true" />
        <span>{label(item.id, item.label)}</span>
      </NavLink>
    );
  }
  return (
    <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        {t("nav.skip")}
      </a>
      <aside className="sidebar">
        <Link to="/app/overview" className="brand">
          <BrandMark size={40} />
          <span>
            {t("app.name")}
            <small>{t("app.tagline")}</small>
          </span>
        </Link>
        <div className="workspace-card">
          <span className="workspace-avatar">
            {workspace.business.name.slice(0, 1)}
          </span>
          <div>
            <strong>{workspace.business.name}</strong>
            <small>{t(workspace.industry.label)}</small>
          </div>
        </div>
        <nav aria-label={t("nav.main")}>{nav.map(renderLink)}</nav>
        <div className="sidebar-bottom">
          {workspace.session!.businesses.length > 1 && (
            <div className="workspace-switcher">
              
              <p>{t(workspace.industry.guidance)}</p>
              <label htmlFor="business-workspace">{t("onboarding.existing")}</label>
              <select
                id="business-workspace"
                className="input"
                value={workspace.business.id}
                disabled={workspace.switching}
                onChange={(e) => {
                  if (e.target.value === workspace.business.id) return;
                  void workspace.switchBusiness(e.target.value).then(() => navigate("/app/overview")).catch(setError);
                }}>
                {workspace.session!.businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button
            variant="ghost"
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={t(collapsed ? "nav.expand" : "nav.collapse")}>
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            <span>{t(collapsed ? "nav.expand" : "nav.collapse")}</span>
          </Button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="app-header">
          <div className="header-context">
            <Link
              className="mobile-brand"
              to="/app/overview"
              aria-label={t("nav.overview")}
            >
              <BrandMark size={40} />
            </Link>
            <div>
              <strong>{title}</strong>
              <span>{workspace.business.name}</span>
            </div>
          </div>
          <div className="header-actions">
            <LanguageDropdown disabled={workspace.switching} />
            <button
              className="account-button"
              aria-label={t("account.menu")}
              aria-haspopup="dialog"
              onClick={() => setAccount(true)}
            >
              <span className="avatar">
                {workspace
                  .session!.user.name.split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          </div>
        </header>
        {!online && (
          <div className="notice notice-error offline-banner" role="status">
            <WifiOff size={17} />
            <Link to="/offline">{t("error.offline")}</Link>
          </div>
        )}
        <motion.main
          id="main-content"
          className="main-content"
          key={`${workspace.business.id}:${location.pathname}`}
          initial={{ y: reduced ? 0 : 8 }}
          animate={{ y: 0 }}
          transition={uiSpring}
          tabIndex={-1}
          inert={workspace.switching}
          aria-busy={workspace.switching}
          data-route={location.pathname}
        >
          <Outlet />
        </motion.main>
        {!!error && !account && <ErrorState error={error} />}
        <PwaControls />
      </div>
      <nav className="mobile-navigation" aria-label={t("nav.main")}>
        {nav.filter((n) => n.mobile).map(renderLink)}
        <button
          onClick={() => setMore(true)}
          aria-label={t("nav.more")}
          aria-haspopup="dialog"
        >
          <MoreHorizontal size={20} />
          <span>{t("nav.more")}</span>
        </button>
      </nav>
      {more && (
        <Dialog title={t("nav.more")} onClose={() => setMore(false)}>
          <nav className="more-navigation">
            {nav.filter((n) => !n.mobile).map(renderLink)}
          </nav>
          {workspace.session!.businesses.length > 1 && (
            <div className="field">
              <label htmlFor="mobile-workspace">{t("onboarding.existing")}</label>
              <select
                id="mobile-workspace"
                className="input"
                value={workspace.business.id}
                disabled={workspace.switching}
                onChange={(e) => {
                  void workspace.switchBusiness(e.target.value).then(() => { setMore(false); navigate("/app/overview"); }).catch(setError);
                }}
              >
                {workspace.session!.businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Link
            className="button button-primary"
            to="/app/appointments/new"
            onClick={() => setMore(false)}
          >
            <Plus size={17} />
            {t("appointment.new")}
          </Link>
        </Dialog>
      )}
      {account && (
        <Dialog title={t("account.menu")} onClose={() => setAccount(false)}>
          <div className="account-info">
            <strong>{workspace.session!.user.name}</strong>
            <span dir="ltr">{workspace.session!.user.email}</span>
          </div>
          <div className="stack">
            <Link className="button button-secondary" to="/onboarding" onClick={() => setAccount(false)}>{t("onboarding.title")}</Link>
            <Link className="button button-secondary" to="/" onClick={() => setAccount(false)}>
              {t("landing.backHome")}
            </Link>
            <Link
              className="button button-secondary"
              to="/app/settings#account"
              onClick={() => setAccount(false)}
            >
              <Settings size={17} />
              {t("account.settings")}
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setError(null);
                void workspace
                  .logout()
                  .then(() => navigate("/login"))
                  .catch(setError);
              }}
            >
              <LogOut size={17} />
              {t("account.logout")}
            </Button>
            {!!error && <ErrorState error={error} />}
          </div>
        </Dialog>
      )}
    </div>
  );
}
