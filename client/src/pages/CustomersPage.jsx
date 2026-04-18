import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  purple: { bg: "#EEEDFE", border: "#AFA9EC", icon: "#534AB7", text: "#3C3489" },
  red:    { bg: "#FCEBEB", border: "#F09595", icon: "#A32D2D", text: "#791F1F" },
  amber:  { bg: "#FAEEDA", border: "#EF9F27", icon: "#854F0B", text: "#633806" },
  teal:   { bg: "#E1F5EE", border: "#5DCAA5", icon: "#0F6E56", text: "#085041" },
  blue:   { bg: "#E6F1FB", border: "#85B7EB", icon: "#185FA5", text: "#0C447C" },
  gray:   { bg: "#F1EFE8", border: "#B4B2A9", icon: "#5F5E5A", text: "#444441" },
};

function getInitials(name = "") {
  const words = name.trim().split(/\s+/);
  if (!name.trim()) return "?";
  if (words.length === 1) return words[0].slice(0, 2);
  return `${words[0][0]}${words[words.length - 1][0]}`;
}

const AVATAR_COLORS = [
  { bg: "#EEEDFE", text: "#3C3489" }, { bg: "#E1F5EE", text: "#085041" },
  { bg: "#FBEAF0", text: "#72243E" }, { bg: "#E6F1FB", text: "#0C447C" },
  { bg: "#FAEEDA", text: "#633806" }, { bg: "#FCEBEB", text: "#791F1F" },
  { bg: "#EAF3DE", text: "#27500A" },
];
function avatarColor(name = "") {
  return AVATAR_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Number(amount || 0));
}
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function getDebtLevel(amount) {
  const v = Number(amount || 0);
  if (v <= 0)    return { label: "ללא חוב",      ...C.teal  };
  if (v <= 500)  return { label: "חוב נמוך",     ...C.blue  };
  if (v <= 2000) return { label: "חוב בינוני",   ...C.amber };
  if (v <= 5000) return { label: "חוב גבוה",     ...C.red   };
                 return { label: "חוב גבוה מאוד",...C.red   };
}

const Icon = {
  plus:     <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  search:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  close:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  phone:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5L6 7a7.9 7.9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  person:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  empty:    <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="18" r="9" stroke="#ccc" strokeWidth="1.5"/><path d="M6 42c0-9.941 8.059-15 18-15s18 5.059 18 15" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  calendar: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  arrow:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

function Avatar({ name }) {
  const { bg, text } = avatarColor(name);
  return (
    <div style={{ width: 40, height: 40, borderRadius: "50%", background: bg, color: text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, userSelect: "none" }}>
      {getInitials(name)}
    </div>
  );
}

function Skeleton({ w, h, radius = 6 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function NewCustomerModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setForm({ fullName: "", phone: "" });
    setError("");
    onClose();
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) { setError("יש להזין שם לקוח"); return; }
    try {
      setLoading(true); setError("");
      await api.post("/customers", { fullName: form.fullName.trim(), phone: form.phone.trim() });
      setForm({ fullName: "", phone: "" });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה ביצירת לקוח");
    } finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.32)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={handleClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, padding: "24px 20px", direction: "rtl" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>לקוח חדש</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>מלא את הפרטים להוספת לקוח</div>
          </div>
          <button onClick={handleClose} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
            {Icon.close}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>שם מלא *</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", right: 11, transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }}>{Icon.person}</div>
              <input autoFocus value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder="ישראל ישראלי"
                style={{ width: "100%", boxSizing: "border-box", border: "0.5px solid #ddd", borderRadius: 9, padding: "10px 36px 10px 12px", fontSize: 13, color: "#1a1a1a", outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>טלפון</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", right: 11, transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }}>{Icon.phone}</div>
              <input value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder="050-0000000"
                style={{ width: "100%", boxSizing: "border-box", border: "0.5px solid #ddd", borderRadius: 9, padding: "10px 36px 10px 12px", fontSize: 13, color: "#1a1a1a", outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>
          {error && (
            <div style={{ background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 600 }}>{error}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={handleSave} disabled={loading} style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, touchAction: "manipulation" }}>
            {loading ? "שומר..." : "הוסף לקוח"}
          </button>
          <button onClick={handleClose} disabled={loading} style={{ background: "#f5f5f5", color: "#555", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Row — Desktop ───────────────────────────────────────────────────
function CustomerRow({ c, onClick, isLast }) {
  const debt = getDebtLevel(c.balance);
  const bal  = Number(c.balance || 0);
  return (
    <div className="cust-row" onClick={onClick} style={{
      display: "flex", alignItems: "center",
      padding: "14px 20px", gap: 12,
      borderBottom: isLast ? "none" : "0.5px solid #f0f0f0",
      cursor: "pointer", transition: "background 0.15s", background: "#fff",
      touchAction: "manipulation",
    }}>
      <Avatar name={c.fullName} />

      {/* Name + phone */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {c.fullName || "—"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#bbb", fontSize: 12 }}>
          {Icon.phone}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.phone || "ללא מספר טלפון"}</span>
        </div>
      </div>

      {/* Balance + bar — hidden on very small screens */}
      <div className="bal-col" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: debt.text, whiteSpace: "nowrap" }}>{formatCurrency(c.balance)}</div>
          <div style={{ fontSize: 10, color: "#bbb" }}>
            {bal <= 0 ? "ללא חוב" : bal <= 1000 ? "נמוך" : bal <= 3000 ? "בינוני" : bal <= 10000 ? "גבוה" : "גבוה מאוד"}
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "#f0f0f0", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: bal <= 0 ? "3%" : bal <= 1000 ? `${Math.round((bal/1000)*30)}%` : bal <= 3000 ? `${30+Math.round(((bal-1000)/2000)*30)}%` : bal <= 10000 ? `${60+Math.round(((bal-3000)/7000)*30)}%` : "100%",
            background: bal <= 0 ? "#22c55e" : bal <= 1000 ? "#3b82f6" : bal <= 3000 ? "#f97316" : "#ef4444",
            borderRadius: 99, transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* Date — hidden on small screens */}
      <div className="date-col" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0, minWidth: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#bbb" }}>
          {Icon.calendar}
          <span style={{ fontSize: 10, color: "#bbb" }}>חשבון פתוח מ</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>{formatDate(c.openedAt)}</span>
      </div>

      <div className="open-btn" style={{ width: 28, height: 28, borderRadius: 8, background: "#EEEDFE", color: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0, transition: "opacity 0.15s" }}>
        {Icon.arrow}
      </div>
    </div>
  );
}

// ─── Customer Card — Mobile ───────────────────────────────────────────────────
function CustomerCard({ c, onClick }) {
  const debt = getDebtLevel(c.balance);
  const bal  = Number(c.balance || 0);
  return (
    <div onClick={onClick} style={{
      background: "#fff", border: "0.5px solid #f0f0f0",
      borderRadius: 12, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
      cursor: "pointer", touchAction: "manipulation",
    }}>
      <Avatar name={c.fullName} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {c.fullName || "—"}
        </div>
        {c.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#bbb", fontSize: 12, marginBottom: 6 }}>
            {Icon.phone}<span>{c.phone}</span>
          </div>
        )}
        <div style={{ height: 5, borderRadius: 99, background: "#f0f0f0", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: bal <= 0 ? "3%" : bal <= 1000 ? `${Math.round((bal/1000)*30)}%` : bal <= 3000 ? `${30+Math.round(((bal-1000)/2000)*30)}%` : bal <= 10000 ? `${60+Math.round(((bal-3000)/7000)*30)}%` : "100%",
            background: bal <= 0 ? "#22c55e" : bal <= 1000 ? "#3b82f6" : bal <= 3000 ? "#f97316" : "#ef4444",
            borderRadius: 99,
          }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: debt.text }}>{formatCurrency(c.balance)}</div>
        <div style={{ fontSize: 10, color: "#aaa" }}>{formatDate(c.openedAt)}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      setError(""); setPageLoading(true);
      const res = await api.get("/customers");
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בטעינת לקוחות");
    } finally { setPageLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      (c.fullName?.toLowerCase() || "").includes(q) ||
      (c.phone || "").includes(searchQuery.trim()) ||
      String(c.balance ?? "").includes(searchQuery.trim())
    );
  }, [customers, searchQuery]);

  return (
    <div style={{
      direction: "rtl", minHeight: "100vh", background: "#F5F6FA",
      padding: "16px", boxSizing: "border-box",
      fontFamily: "'Segoe UI', 'Arial Hebrew', Arial, sans-serif",
    }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .cust-row:hover { background: #fafafe !important; }
        .cust-row:hover .open-btn { opacity: 1 !important; }
        input:focus { border-color: #AFA9EC !important; box-shadow: 0 0 0 3px #EEEDFE !important; }

        /* Desktop list */
        .cust-list-desktop { display: flex; flex-direction: column; }
        /* Mobile cards */
        .cust-list-mobile  { display: none; flex-direction: column; gap: 8px; }

        @media (max-width: 640px) {
          .cust-list-desktop { display: none !important; }
          .cust-list-mobile  { display: flex !important; }
          .bal-col  { display: none !important; }
          .date-col { display: none !important; }
          .page-pad { padding: 12px !important; }
          .header-pad { padding: 16px !important; }
        }
      `}</style>

      <NewCustomerModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchCustomers} />

      <div className="page-pad" style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── Header ── */}
        <div className="header-pad" style={{
          background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14,
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#bbb", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>מערכת ניהול חשבונות</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>לקוחות</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>ניהול רשימת הלקוחות שלך בצורה נוחה ומסודרת</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!pageLoading && (
              <div style={{ background: "#F1EFE8", color: "#5F5E5A", border: "0.5px solid #D3D1C7", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>
                {customers.length} לקוחות
              </div>
            )}
            <button onClick={() => setModalOpen(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#534AB7", color: "#fff", border: "none",
              borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", touchAction: "manipulation", whiteSpace: "nowrap",
            }}>
              {Icon.plus} לקוח חדש
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#bbb", flexShrink: 0 }}>{Icon.search}</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חפש לפי שם לקוח, טלפון או סכום..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#1a1a1a", background: "transparent", fontFamily: "inherit", minWidth: 0 }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background: "#f0f0f0", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", flexShrink: 0 }}>
              {Icon.close}
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{error}</div>
        )}

        {/* ── Content ── */}
        {pageLoading ? (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, overflow: "hidden" }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ padding: "14px 20px", borderBottom: i < 5 ? "0.5px solid #f0f0f0" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0f0f0", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton w="40%" h={13} />
                  <div style={{ marginTop: 6 }}><Skeleton w="25%" h={11} /></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <Skeleton w={60} h={13} />
                  <Skeleton w={50} h={10} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
            {Icon.empty}
            <div style={{ fontSize: 15, fontWeight: 600, color: "#bbb", marginTop: 16, marginBottom: 6 }}>
              {searchQuery ? "לא נמצאו לקוחות" : "אין לקוחות להצגה"}
            </div>
            <div style={{ fontSize: 12, color: "#ccc", marginBottom: 20 }}>
              {searchQuery ? "נסה לחפש בשם אחר, מספר טלפון או סכום" : "הוסף את הלקוח הראשון שלך עכשיו"}
            </div>
            {!searchQuery && (
              <button onClick={() => setModalOpen(true)} style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 9, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                צור לקוח ראשון
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop list */}
            <div className="cust-list-desktop" style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, overflow: "hidden" }}>
              {filtered.map((c, i) => (
                <CustomerRow key={c._id} c={c} isLast={i === filtered.length - 1} onClick={() => navigate(`/account/${c._id}`)} />
              ))}
            </div>

            {/* Mobile cards */}
            <div className="cust-list-mobile">
              {filtered.map(c => (
                <CustomerCard key={c._id} c={c} onClick={() => navigate(`/account/${c._id}`)} />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
