import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalSearch from "./GlobalSearch";
import { useDarkMode } from "../App";

const Icon = {
  dashboard: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /></svg>,
  customers: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1 14c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M11 7c1.5 0 4 .8 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  items: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 2v12M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  quotes: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6 6h4M6 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  delivery: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M11 7h2.5L15 10v3h-4V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><circle cx="4" cy="13.5" r="1.2" stroke="currentColor" strokeWidth="1.2" /><circle cx="12" cy="13.5" r="1.2" stroke="currentColor" strokeWidth="1.2" /></svg>,
  analytics: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 12l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  settings: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  logout: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  logo: <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M4 8h24M4 16h16M4 24h20" stroke="#534AB7" strokeWidth="2.5" strokeLinecap="round" /><circle cx="26" cy="24" r="4" fill="#FAEEDA" stroke="#FAC775" strokeWidth="1.5" /><path d="M24.5 24l1 1L27.5 23" stroke="#854F0B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  close: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  search: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" /><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
};

const NAV = [
  { label: "לוח בקרה",     path: "/",               icon: Icon.dashboard },
  { label: "לקוחות",       path: "/customers",       icon: Icon.customers },
  { label: "פריטים",       path: "/items",           icon: Icon.items     },
  { label: "הצעות מחיר",   path: "/quotes",          icon: Icon.quotes    },
  { label: "תעודות משלוח", path: "/delivery-notes",  icon: Icon.delivery  },
  { label: "דוחות",        path: "/analytics",       icon: Icon.analytics },
  { label: "הגדרות",       path: "/settings",        icon: Icon.settings  },
];

const BOTTOM_NAV = [
  { label: "בקרה",    path: "/",           icon: Icon.dashboard },
  { label: "לקוחות", path: "/customers",   icon: Icon.customers },
  { label: "פריטים", path: "/items",       icon: Icon.items     },
  { label: "הצעות",  path: "/quotes",      icon: Icon.quotes    },
  { label: "דוחות",  path: "/analytics",   icon: Icon.analytics },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { dark, toggle } = useDarkMode();

  const D = dark ? {
    pageBg:       "#0f1117",
    navBg:        "rgba(15,17,23,0.97)",
    navBorder:    "#2a2d3a",
    navText:      "#d4d6e0",
    navTextMuted: "#8b8fa8",
    btnBg:        "#1a1d27",
    drawerBg:     "#1a1d27",
    drawerBorder: "#2a2d3a",
    drawerText:   "#d4d6e0",
    drawerMuted:  "#8b8fa8",
    bottomNavBg:  "rgba(15,17,23,0.97)",
    bottomBorder: "#2a2d3a",
    searchBarBg:  "#1a1d27",
    toggleBg:     "#22253a",
  } : {
    pageBg:       "#F5F6FA",
    navBg:        "rgba(255,255,255,0.97)",
    navBorder:    "#e8e8e8",
    navText:      "#1a1a1a",
    navTextMuted: "#aaa",
    btnBg:        "#f5f5f5",
    drawerBg:     "#fff",
    drawerBorder: "#f0f0f0",
    drawerText:   "#444",
    drawerMuted:  "#aaa",
    bottomNavBg:  "rgba(255,255,255,0.97)",
    bottomBorder: "#e8e8e8",
    searchBarBg:  "#fff",
    toggleBg:     "#f5f5f5",
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: D.pageBg,
      fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
      direction: "rtl",
      transition: "background 0.2s ease",
    }}>
      <style>{`
        .nav-btn { transition: background 0.15s, color 0.15s; }
        .nav-btn:hover:not(.active) { background: ${D.btnBg} !important; }
        .logout-btn:hover { background: #FCEBEB !important; color: #A32D2D !important; }
        .dark-toggle:hover { opacity: 0.85; }

        .drawer-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.45);
          animation: fadeOverlay 0.2s ease;
        }
        @keyframes fadeOverlay { from{opacity:0} to{opacity:1} }

        .drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: 260px; z-index: 201;
          background: ${D.drawerBg};
          box-shadow: -4px 0 24px rgba(0,0,0,0.18);
          display: flex; flex-direction: column;
          animation: slideDrawer 0.22s ease;
        }
        @keyframes slideDrawer { from{transform:translateX(100%)} to{transform:translateX(0)} }

        .bottom-nav {
          position: fixed; bottom: 0; right: 0; left: 0;
          z-index: 100;
          background: ${D.bottomNavBg};
          border-top: 0.5px solid ${D.bottomBorder};
          backdrop-filter: blur(12px);
          display: none;
          padding-bottom: env(safe-area-inset-bottom);
        }

        @media (max-width: 768px) {
          .desktop-nav    { display: none !important; }
          .desktop-search { display: none !important; }
          .desktop-logout { display: none !important; }
          .desktop-toggle { display: none !important; }
          .mobile-actions { display: flex !important; }
          .bottom-nav     { display: flex !important; }
          .page-content   { padding-bottom: 70px !important; }
        }
        @media (min-width: 769px) {
          .mobile-actions { display: none !important; }
          .bottom-nav     { display: none !important; }
        }

        .bottom-btn {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 3px; padding: 8px 4px;
          border: none; background: none; cursor: pointer;
          font-family: inherit; transition: color 0.15s;
          color: ${dark ? "#8b8fa8" : "#aaa"}; font-size: 10px; font-weight: 500;
        }
        .bottom-btn.active { color: #534AB7; }
        .bottom-btn:not(.active):hover { color: ${dark ? "#d4d6e0" : "#555"}; }

        .mobile-search-bar {
          position: fixed; top: 60px; right: 0; left: 0;
          z-index: 99;
          background: ${D.searchBarBg};
          border-bottom: 0.5px solid ${D.navBorder};
          padding: 10px 16px;
          animation: slideDown 0.18s ease;
        }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Navbar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: D.navBg,
        borderBottom: `0.5px solid ${D.navBorder}`,
        backdropFilter: "blur(12px)",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}>
        <div style={{
          maxWidth: 1400, margin: "0 auto",
          display: "flex", alignItems: "center",
          padding: "0 16px", gap: 12, height: 60,
        }}>

          {/* Logo */}
          <div onClick={() => { navigate("/"); setMenuOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}>
            {Icon.logo}
            <span style={{ fontSize: 15, fontWeight: 800, color: D.navText, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              Yasmine Ledger
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
            {NAV.map(({ label, path, icon }) => {
              const active = isActive(path);
              return (
                <button key={path} className={`nav-btn${active ? " active" : ""}`}
                  onClick={() => navigate(path)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", borderRadius: 8, border: "none",
                    background: active ? "#534AB7" : "transparent",
                    color: active ? "#fff" : D.navTextMuted,
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    cursor: "pointer", whiteSpace: "nowrap",
                    fontFamily: "inherit",
                  }}
                >
                  {icon}{label}
                </button>
              );
            })}
          </div>

          {/* Desktop Search */}
          <div className="desktop-search" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <GlobalSearch />
          </div>

          {/* Desktop Logout */}
          <button className="logout-btn desktop-logout" onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, border: "none",
              background: "transparent", color: D.navTextMuted,
              fontSize: 13, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "inherit", flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {Icon.logout} יציאה
          </button>

          {/* Dark Mode Toggle — desktop only */}
          <button className="dark-toggle desktop-toggle" onClick={toggle}
            title={dark ? "מצב יום" : "מצב לילה"}
            style={{
              width: 36, height: 36, borderRadius: 9, border: "none",
              background: D.toggleBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 17, flexShrink: 0,
              transition: "background 0.2s ease",
            }}
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {/* Mobile actions */}
          <div className="mobile-actions" style={{ marginRight: "auto", alignItems: "center", gap: 4 }}>
            {/* Dark toggle — mobile only */}
            <button className="dark-toggle" onClick={toggle}
              style={{
                width: 36, height: 36, borderRadius: 9, border: "none",
                background: D.toggleBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 16, flexShrink: 0,
              }}
            >
              {dark ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setSearchOpen(p => !p)}
              style={{
                width: 36, height: 36, borderRadius: 9, border: "none",
                background: searchOpen ? "#EEEDFE" : D.btnBg,
                color: searchOpen ? "#534AB7" : D.navTextMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {Icon.search}
            </button>
            <button onClick={() => setMenuOpen(p => !p)}
              style={{
                width: 36, height: 36, borderRadius: 9, border: "none",
                background: menuOpen ? "#EEEDFE" : D.btnBg,
                color: menuOpen ? "#534AB7" : D.navTextMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {menuOpen ? Icon.close : Icon.menu}
            </button>
          </div>

        </div>
      </div>

      {/* ── Mobile Search Bar ── */}
      {searchOpen && (
        <div className="mobile-search-bar">
          <GlobalSearch autoFocus onClose={() => setSearchOpen(false)} />
        </div>
      )}

      {/* ── Mobile Drawer ── */}
      {menuOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setMenuOpen(false)} />
          <div className="drawer">

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: `0.5px solid ${D.drawerBorder}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {Icon.logo}
                <span style={{ fontSize: 14, fontWeight: 800, color: D.drawerText }}>Yasmine Ledger</span>
              </div>
              <button onClick={() => setMenuOpen(false)}
                style={{ background: D.btnBg, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: D.drawerMuted }}>
                {Icon.close}
              </button>
            </div>

            <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
              {NAV.map(({ label, path, icon }) => {
                const active = isActive(path);
                return (
                  <button key={path}
                    onClick={() => { navigate(path); setMenuOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 10, border: "none",
                      background: active ? (dark ? "#1e1b3a" : "#EEEDFE") : "transparent",
                      color: active ? (dark ? "#a89fe0" : "#3C3489") : D.drawerText,
                      fontSize: 14, fontWeight: active ? 700 : 500,
                      cursor: "pointer", textAlign: "right",
                      fontFamily: "inherit", width: "100%",
                      transition: "background 0.15s",
                    }}
                  >
                    <span style={{ color: active ? "#534AB7" : D.drawerMuted, flexShrink: 0 }}>{icon}</span>
                    {label}
                    {active && <span style={{ marginRight: "auto", width: 6, height: 6, borderRadius: "50%", background: "#534AB7" }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ padding: "12px", borderTop: `0.5px solid ${D.drawerBorder}` }}>
              <button onClick={() => { logout(); setMenuOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 10, border: "none",
                  background: dark ? "#2a1a1a" : "#FCEBEB",
                  color: "#A32D2D",
                  fontSize: 14, fontWeight: 600,
                  cursor: "pointer", width: "100%",
                  fontFamily: "inherit",
                }}
              >
                {Icon.logout} יציאה
              </button>
            </div>

          </div>
        </>
      )}

      {/* ── Content ── */}
      <div className={`page-content${dark ? " dm-page-content" : ""}`} style={{ maxWidth: 1400, margin: "0 auto" }}>
        <Outlet />
      </div>

      {/* ── Bottom Nav (Mobile) ── */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(({ label, path, icon }) => {
          const active = isActive(path);
          return (
            <button key={path} className={`bottom-btn${active ? " active" : ""}`} onClick={() => navigate(path)}>
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 8,
                background: active ? (dark ? "#1e1b3a" : "#EEEDFE") : "transparent",
                transition: "background 0.15s",
              }}>
                {icon}
              </span>
              {label}
            </button>
          );
        })}
        <button className={`bottom-btn${isActive("/settings") ? " active" : ""}`} onClick={() => navigate("/settings")}>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 8,
            background: isActive("/settings") ? (dark ? "#1e1b3a" : "#EEEDFE") : "transparent",
            transition: "background 0.15s",
          }}>
            {Icon.settings}
          </span>
          הגדרות
        </button>
      </nav>

    </div>
  );
}
