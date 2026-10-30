import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import LanguageSelect from "./LanguageSelect";

export default function Layout() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  const links = [
    { to: "/spedisci", label: t.nav.send },
    { to: "/voli", label: t.nav.flights },
    { to: "/messenger", label: t.nav.messenger },
  ];

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">✦</span> Amanah
          </Link>
          <div className="header-right">
            <LanguageSelect />
            <button className="menu-toggle" aria-expanded={open} aria-label={t.nav.menu} onClick={() => setOpen(!open)}>
              <span />
              <span />
              <span />
            </button>
          </div>
          <nav className={open ? "nav open" : "nav"}>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <div className="brand light">
              <span className="brand-mark">✦</span> Amanah
            </div>
            <p>{t.footer.tagline}</p>
          </div>
          <p className="muted-light">
            {t.disclaimer}
            <br />
            <Link to="/condizioni" className="footer-link">
              {t.footer.terms}
            </Link>{" "}
            · {t.footer.payments}
            <br />© {new Date().getFullYear()} Amanah
          </p>
        </div>
      </footer>
    </>
  );
}
