import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  purple: { bg: "#EEEDFE", border: "#AFA9EC", icon: "#534AB7", text: "#3C3489" },
  red:    { bg: "#FCEBEB", border: "#F09595", icon: "#A32D2D", text: "#791F1F" },
  amber:  { bg: "#FAEEDA", border: "#FAC775", icon: "#854F0B", text: "#633806" },
  teal:   { bg: "#E1F5EE", border: "#5DCAA5", icon: "#0F6E56", text: "#085041" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTypeInfo(type) {
  if (type === "debt")    return { label: "חוב",   color: C.red   };
  if (type === "payment") return { label: "תשלום", color: C.teal  };
  return                         { label: "החזרה", color: C.amber };
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL");
}

function initials(name = "") {
  const w = name.trim().split(/\s+/);
  if (!name.trim()) return "?";
  if (w.length === 1) return w[0].slice(0, 2);
  return `${w[0][0]}${w[w.length - 1][0]}`;
}

const AVATAR_COLORS = [
  { bg: "#EEEDFE", text: "#3C3489" }, { bg: "#E1F5EE", text: "#085041" },
  { bg: "#FBEAF0", text: "#72243E" }, { bg: "#E6F1FB", text: "#0C447C" },
  { bg: "#FAEEDA", text: "#633806" },
];
function avatarColor(name = "") {
  return AVATAR_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  search: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  close:  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  person: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  receipt:<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h4M6 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  phone:  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5L6 7a7.9 7.9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  empty:  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="14" cy="14" r="9" stroke="#ddd" strokeWidth="1.5"/><path d="M21 21l7 7" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ width: 16, height: 16, border: "2px solid #e8e8e8", borderTop: "2px solid #534AB7", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "#FAFAFA", borderBottom: "0.5px solid #f0f0f0" }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#bbb", background: "#f0f0f0", borderRadius: 20, padding: "1px 8px" }}>{count}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GlobalSearch({ autoFocus = false, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef();
  const dropdownRef = useRef();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ customers: [], transactions: [] });
  const [activeIndex, setActiveIndex] = useState(-1);

  const flatResults = [
    ...results.customers.map(c => ({ type: "customer", data: c })),
    ...results.transactions.map(t => ({ type: "transaction", data: t })),
  ];

  const hasResults = results.customers.length > 0 || results.transactions.length > 0;

  // ── Auto focus للموبايل ──
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.querySelector("input")?.focus(), 80);
    }
  }, [autoFocus]);

  // ── Debounced search ──
  useEffect(() => {
    const trimmed = query.trim();
    setActiveIndex(-1);
    if (!trimmed) { setResults({ customers: [], transactions: [] }); setLoading(false); return; }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/search/global?q=${encodeURIComponent(trimmed)}`);
        setResults({ customers: data.customers || [], transactions: data.transactions || [] });
        setOpen(true);
      } catch { /* silent */ } finally { setLoading(false); }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // ── Keyboard navigation ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open || !flatResults.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(p => p < flatResults.length - 1 ? p + 1 : 0); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIndex(p => p > 0 ? p - 1 : flatResults.length - 1); }
      if (e.key === "Enter") {
        e.preventDefault();
        const sel = flatResults[activeIndex];
        if (!sel) return;
        if (sel.type === "customer") navigate(`/account/${sel.data._id}`);
        else if (sel.data.customerId) navigate(`/account/${sel.data.customerId}`);
        handleClear();
      }
      if (e.key === "Escape") { setOpen(false); onClose?.(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, flatResults, activeIndex]);

  // ── Click outside ──
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleClear = () => {
    setQuery("");
    setResults({ customers: [], transactions: [] });
    setOpen(false);
    onClose?.();
  };

  const navigate2 = (path) => { navigate(path); handleClear(); };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 420, direction: "rtl" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes dropIn  { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }

        /* على الموبايل الـ dropdown يمتد بعرض الشاشة كاملاً */
        @media (max-width: 768px) {
          .gs-dropdown {
            position: fixed !important;
            top: 120px !important;
            right: 0 !important;
            left: 0 !important;
            border-radius: 0 0 16px 16px !important;
            max-height: calc(100vh - 130px) !important;
            border-right: none !important;
            border-left: none !important;
            border-top: none !important;
          }
        }
      `}</style>

      {/* ── Input ── */}
      <div ref={inputRef} style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#fff", border: `0.5px solid ${open && query ? "#AFA9EC" : "#e0e0e0"}`,
        borderRadius: 10, padding: "7px 12px",
        boxShadow: open && query ? "0 0 0 3px #EEEDFE" : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}>
        <span style={{ color: open && query ? "#534AB7" : "#bbb", flexShrink: 0, display: "flex", transition: "color 0.15s" }}>
          {Icon.search}
        </span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          placeholder="חיפוש לקוחות, טלפון או תנועות..."
          style={{
            flex: 1, border: "none", outline: "none", fontSize: 13,
            color: "#1a1a1a", background: "transparent",
            fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif", direction: "rtl",
            minWidth: 0,
          }}
        />
        {loading && <Spinner />}
        {!loading && query && (
          <button onClick={handleClear} style={{
            background: "#f0f0f0", border: "none", borderRadius: 6,
            width: 22, height: 22, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#888", flexShrink: 0, touchAction: "manipulation",
          }}>
            {Icon.close}
          </button>
        )}
        {/* زر إغلاق على الموبايل إذا كان مفتوحاً من الـ navbar */}
        {onClose && !query && (
          <button onClick={onClose} style={{
            background: "#f0f0f0", border: "none", borderRadius: 6,
            width: 22, height: 22, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#888", flexShrink: 0, touchAction: "manipulation",
          }}>
            {Icon.close}
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && query.trim() && (
        <div ref={dropdownRef} className="gs-dropdown" style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, left: 0, zIndex: 999,
          background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12,
          overflow: "hidden", maxHeight: 460, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          animation: "dropIn 0.15s ease",
          WebkitOverflowScrolling: "touch",
        }}>

          {/* No results */}
          {!loading && !hasResults && (
            <div style={{ padding: "28px 20px", textAlign: "center" }}>
              {Icon.empty}
              <div style={{ fontSize: 14, fontWeight: 700, color: "#bbb", marginTop: 12, marginBottom: 4 }}>לא נמצאו תוצאות</div>
              <div style={{ fontSize: 12, color: "#ccc" }}>נסה לחפש לפי שם לקוח, טלפון, תיאור או הערה</div>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <>
              <SectionHeader title="לקוחות" count={results.customers.length} />
              {results.customers.map((c, i) => {
                const isActive = flatResults[activeIndex]?.data?._id === c._id;
                const av = avatarColor(c.fullName || "");
                return (
                  <div key={c._id} onClick={() => navigate2(`/account/${c._id}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px", cursor: "pointer",
                      background: isActive ? "#EEEDFE" : "#fff",
                      borderBottom: i < results.customers.length - 1 ? "0.5px solid #f5f5f5" : "none",
                      transition: "background 0.1s",
                      touchAction: "manipulation",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#FAFAFE"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "#fff"; }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: av.bg, color: av.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {initials(c.fullName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{c.fullName}</div>
                      <div style={{ fontSize: 11, color: "#bbb", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                        {Icon.phone}
                        <span>{c.phone || "ללא מספר טלפון"}</span>
                      </div>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: isActive ? "#534AB7" : "#f5f5f5", color: isActive ? "#fff" : "#bbb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                      {Icon.person}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Divider */}
          {results.customers.length > 0 && results.transactions.length > 0 && (
            <div style={{ height: "0.5px", background: "#f0f0f0" }} />
          )}

          {/* Transactions */}
          {results.transactions.length > 0 && (
            <>
              <SectionHeader title="תנועות" count={results.transactions.length} />
              {results.transactions.map((tx, i) => {
                const isActive = flatResults[activeIndex]?.data?._id === tx._id;
                const { label, color } = getTypeInfo(tx.type);
                return (
                  <div key={tx._id}
                    onClick={() => { if (tx.customerId) navigate2(`/account/${tx.customerId}`); }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "12px 14px", cursor: tx.customerId ? "pointer" : "default",
                      background: isActive ? "#EEEDFE" : "#fff",
                      borderBottom: i < results.transactions.length - 1 ? "0.5px solid #f5f5f5" : "none",
                      transition: "background 0.1s",
                      touchAction: "manipulation",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#FAFAFE"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "#fff"; }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: color.bg, color: color.icon, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      {Icon.receipt}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.customerName}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 20, background: color.bg, fontSize: 10, fontWeight: 700, color: color.text, whiteSpace: "nowrap", flexShrink: 0 }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: color.icon }} />
                          {label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                        {tx.description || "ללא תיאור"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "#ccc" }}>{fmtDate(tx.date)}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: color.text, whiteSpace: "nowrap" }}>
                          {Number(tx.amount || 0).toLocaleString("he-IL")} ₪
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
