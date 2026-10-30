import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { DISCLAIMER_SHORT } from "../lib/terms";

const LINKS = [
  { to: "/spedisci", label: "Spedisci" },
  { to: "/voli", label: "Voli & Messenger" },
  { to: "/messenger", label: "Diventa Messenger" },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">✦</span> Amanah
          </Link>
          <button className="menu-toggle" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
            <span />
            <span />
            <span />
          </button>
          <nav className={open ? "nav open" : "nav"}>
            {LINKS.map((l) => (
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
            <p>Dal tuo paese a casa tua, con persone di fiducia.</p>
          </div>
          <p className="muted-light">
            {DISCLAIMER_SHORT}
            <br />
            <Link to="/condizioni" className="footer-link">
              Condizioni e responsabilità
            </Link>{" "}
            · Pagamenti sicuri con Stripe
            <br />© {new Date().getFullYear()} Amanah
          </p>
        </div>
      </footer>
    </>
  );
}
