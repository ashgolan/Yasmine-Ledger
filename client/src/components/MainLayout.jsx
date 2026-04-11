import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalSearch from "./GlobalSearch";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  dashboard: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  customers: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 7c1.5 0 4 .8 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  items:     <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 2v12M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  quotes:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h4M6 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  settings:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  logout:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  logo:      <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M4 8h24M4 16h16M4 24h20" stroke="#534AB7" strokeWidth="2.5" strokeLinecap="round"/><circle cx="26" cy="24" r="4" fill="#FAEEDA" stroke="#FAC775" strokeWidth="1.5"/><path d="M24.5 24l1 1L27.5 23" stroke="#854F0B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const NAV = [
  { label: "לוח בקרה",   path: "/",          icon: Icon.dashboard },
  { label: "לקוחות",     path: "/customers", icon: Icon.customers },
  { label: "פריטים",     path: "/items",     icon: Icon.items     },
  { label: "הצעות מחיר", path: "/quotes",    icon: Icon.quotes    },
  { label: "הגדרות",     path: "/settings",  icon: Icon.settings  },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F6FA", fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif", direction: "rtl" }}>
      <style>{`
        .nav-btn { transition: background 0.15s, color 0.15s; }
        .nav-btn:hover:not(.active) { background: #f5f5f5 !important; }
        .logout-btn:hover { background: #FCEBEB !important; color: #A32D2D !important; }
      `}</style>

      {/* ── Navbar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.97)",
        borderBottom: "0.5px solid #e8e8e8",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: 1400, margin: "0 auto",
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 16, height: 60,
        }}>

          {/* Logo */}
          <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}>
            {Icon.logo}
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              Yasmine Ledger
            </span>
          </div>

          {/* Nav items */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
            {NAV.map(({ label, path, icon }) => {
              const active = isActive(path);
              return (
                <button
                  key={path}
                  className={`nav-btn${active ? " active" : ""}`}
                  onClick={() => navigate(path)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", borderRadius: 8, border: "none",
                    background: active ? "#534AB7" : "transparent",
                    color: active ? "#fff" : "#555",
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    cursor: "pointer", whiteSpace: "nowrap",
                    fontFamily: "inherit",
                  }}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search — center */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <GlobalSearch />
          </div>

          {/* Logout */}
          <button
            className="logout-btn"
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, border: "none",
              background: "transparent", color: "#aaa",
              fontSize: 13, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "inherit", flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {Icon.logout}
            יציאה
          </button>

        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <Outlet />
      </div>
    </div>
  );
}
