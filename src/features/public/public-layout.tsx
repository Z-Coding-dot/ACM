import { usePublicText } from './public-text';
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigationType } from "react-router-dom";
import { ArrowUpRight, Menu, UserRound, ArrowRight, ArrowUp } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useAuth } from "../../app/workspace";
import { LanguageDropdown } from "../../components/ui/language-dropdown";
import { BrandLogo } from "../../components/ui/brand";
import { Button, Dialog } from "../../components/ui/primitives";
import { MotionLink, Reveal } from "../../components/ui/motion";
import { uiSpring } from "../../lib/motion";
import "./public.css";

export function PublicAction({
  className = "button button-primary",
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const { session } = useAuth();
  const t = usePublicText();
  const reduced = useReducedMotion();
  return (
    <MotionLink
      className={className}
      to={session ? "/app/overview" : "/signup"}
      onClick={onNavigate}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={uiSpring}
    >
      {t(session ? "landing.openDashboard" : "landing.getStarted")}
      <ArrowUpRight size={17} className="directional" aria-hidden="true" />
    </MotionLink>
  );
}
export function PublicLayout({ children }: { children: ReactNode }) {
  const t = usePublicText();
  const { session } = useAuth();
  const { pathname, hash } = useLocation();
  const reduced = useReducedMotion();
  const navigationType = useNavigationType();
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (document.activeElement?.closest(".language-dropdown")) return;
    const anchor = hash ? document.getElementById(hash.slice(1)) : null;
    if (anchor) {
      anchor.scrollIntoView({
        block: "start",
        behavior: reduced ? "auto" : "smooth",
      });
      anchor.focus({ preventScroll: true });
    } else if (navigationType !== "POP")
      document.getElementById("public-main")?.focus({ preventScroll: true });
  }, [pathname, hash, navigationType, reduced]);
  function userLink() {
    return (
      session && (
        <Link
          className="public-user"
          to="/app/overview"
          title={session.user.name}
          aria-label={t("landing.userDashboard", { name: session.user.name })}
          onClick={() => setMenu(false)}
        >
          <span className="public-user-avatar" aria-hidden="true">
            <UserRound size={17} />
          </span>
          <span className="public-user-name">{session.user.name}</span>
        </Link>
      )
    );
  }
  return (
    <div className="public-site">
      <a className="skip-link" href="#public-main">
        {t("nav.skip")}
      </a>
      <header className="public-header">
        <div
          className="public-container public-nav"
          data-authenticated={!!session}
        >
          <BrandLogo className="public-brand" wordmark={false} size={64} />
          <nav className="public-sections" aria-label={t("landing.navigation")}>
            <Link to="/#features">{t("landing.features")}</Link>
            <Link to="/#businesses">{t("landing.forBusinesses")}</Link>
          </nav>
          <div className="public-language">
            <LanguageDropdown />
          </div>
          <div
            className={`public-auth ${session ? "signed-in" : "signed-out"}`}
          >
            {session ? (
              userLink()
            ) : (
              <Link className="public-sign-in" to="/login">
                {t("auth.signin")}
              </Link>
            )}
            <PublicAction />
          </div>
          <Button
            variant="ghost"
            className="public-menu-toggle"
            aria-label={t("landing.menu")}
            aria-expanded={menu}
            aria-haspopup="dialog"
            onClick={() => setMenu(true)}
          >
            <Menu size={22} aria-hidden="true" />
          </Button>
        </div>
      </header>
      <main id="public-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="public-footer">
        <div className="public-container">
          <Reveal className="public-footer-grid">
            <div className="public-footer-brand">
              <BrandLogo wordmark={false} size={64} />
              <p>{t("landing.footerDescription")}</p>
              <span className="public-language-note">
                {t("landing.languages")}
              </span>
            </div>
            <nav aria-label={t("landing.footerProduct")}>
              <h2>{t("landing.footerProduct")}</h2>
              <Link to="/#features">{t("landing.features")}</Link>
              <Link to="/#businesses">{t("landing.forBusinesses")}</Link>
              <Link to="/#how-it-works">{t("landing.howTitle")}</Link>
            </nav>
            <nav aria-label={t("landing.footerResources")}>
              <h2>{t("landing.footerResources")}</h2>
              <Link to="/about">{t("landing.productInfo")}</Link>
              <Link to="/about#data">{t("landing.dataInfo")}</Link>
            </nav>
            <nav aria-label={t("landing.footerWorkspace")}>
              <h2>{t("landing.footerWorkspace")}</h2>
              {session ? (
                userLink()
              ) : (
                <>
                  <Link to="/login">{t("auth.signin")}</Link>
                  <Link to="/signup">{t("landing.getStarted")}</Link>
                </>
              )}
              <Link to="/about#data">
                {t("landing.previewInfo")}
                <ArrowRight
                  size={15}
                  className="directional"
                  aria-hidden="true"
                />
              </Link>
            </nav>
          </Reveal>
          <div className="public-footer-bottom">
            <p>{t("landing.footerNote")}</p>
            <Link className="back-to-top" to="/#public-main" aria-label={t("landing.backTop")} title={t("landing.backTop")}><ArrowUp size={20} aria-hidden="true" /></Link>
          </div>
        </div>
      </footer>
      {menu && (
        <Dialog title={t("landing.menu")} className="navigation-dialog" onClose={() => setMenu(false)}>
          <nav
            className="public-mobile-links"
            aria-label={t("landing.navigation")}
          >
            {[
              ["/#features", "landing.features"],
              ["/#businesses", "landing.forBusinesses"],
              ["/#how-it-works", "landing.howTitle"],
              ["/about", "landing.productInfo"],
              ["/about#data", "landing.dataInfo"],
            ].map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setMenu(false)}>
                {t(label)}
                <ArrowUpRight
                  size={17}
                  className="directional"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </nav>
          <div className="public-mobile-account">
            {session ? (
              userLink()
            ) : (
              <Link
                className="button button-secondary"
                to="/login"
                onClick={() => setMenu(false)}
              >
                {t("auth.signin")}
              </Link>
            )}
            <PublicAction onNavigate={() => setMenu(false)} />
          </div>
        </Dialog>
      )}
    </div>
  );
}
