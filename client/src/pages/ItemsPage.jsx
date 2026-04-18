import { useEffect, useState } from "react";
import { api } from "../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  purple: { bg: "#EEEDFE", border: "#AFA9EC", icon: "#534AB7", text: "#3C3489" },
  red:    { bg: "#FCEBEB", border: "#F09595", icon: "#A32D2D", text: "#791F1F" },
  amber:  { bg: "#FAEEDA", border: "#FAC775", icon: "#854F0B", text: "#633806" },
  teal:   { bg: "#E1F5EE", border: "#5DCAA5", icon: "#0F6E56", text: "#085041" },
  blue:   { bg: "#E6F1FB", border: "#85B7EB", icon: "#185FA5", text: "#0C447C" },
  gray:   { bg: "#F1EFE8", border: "#B4B2A9", icon: "#5F5E5A", text: "#444441" },
};

function fmtCurrency(n) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Number(n || 0));
}

const Icon = {
  plus:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  box:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 2v12M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  tag:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 2h5l7 7-5 5-7-7V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="5" cy="5" r="1" fill="currentColor"/></svg>,
  shekel: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 12V5a3 3 0 016 0v7M4 9h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  empty:  <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M8 16l16-8 16 8v16l-16 8-16-8V16z" stroke="#ddd" strokeWidth="1.5" strokeLinejoin="round"/><path d="M24 8v32M8 16l16 8 16-8" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

function Skeleton({ w, h, radius = 6 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function NewItemModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", category: "", price: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setForm({ name: "", category: "", price: "" });
    setError(""); onClose();
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("יש להזין שם פריט"); return; }
    try {
      setLoading(true); setError("");
      await api.post("/items", { name: form.name.trim(), category: form.category.trim(), price: Number(form.price || 0) });
      setForm({ name: "", category: "", price: "" });
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה ביצירת פריט");
    } finally { setLoading(false); }
  };

  if (!open) return null;

  const inputStyle = {
    border: "0.5px solid #ddd", borderRadius: 8, padding: "9px 10px",
    fontSize: 13, color: "#1a1a1a", outline: "none", background: "#fff",
    width: "100%", boxSizing: "border-box",
    fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.28)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}
      onClick={handleClose}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 460, padding: "24px 20px 32px", direction: "rtl" }}
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e0e0e0", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>פריט חדש</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>הוסף פריט למאגר</div>
          </div>
          <button onClick={handleClose} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", touchAction: "manipulation" }}>
            {Icon.close}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "שם פריט *", key: "name",     type: "text",   icon: Icon.box,    placeholder: "שם הפריט" },
            { label: "קטגוריה",   key: "category",  type: "text",   icon: Icon.tag,    placeholder: "לדוגמה: מזון, ביגוד..." },
            { label: "מחיר",      key: "price",     type: "number", icon: Icon.shekel, placeholder: "0" },
          ].map(({ label, key, type, icon, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 5 }}>{label}</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{icon}</div>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  placeholder={placeholder}
                  autoFocus={key === "name"}
                  style={{ ...inputStyle, paddingRight: 32 }}
                />
              </div>
            </div>
          ))}

          {error && (
            <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>{error}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={handleSave} disabled={loading} style={{
            flex: 1, background: "#534AB7", color: "#fff", border: "none", borderRadius: 9,
            padding: "11px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, touchAction: "manipulation",
          }}>
            {loading ? "שומר..." : "הוסף פריט"}
          </button>
          <button onClick={handleClose} disabled={loading} style={{
            flex: 1, background: "#f5f5f5", color: "#555", border: "none", borderRadius: 9,
            padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", touchAction: "manipulation",
          }}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    try {
      setError(""); setLoading(true);
      const res = await api.get("/items");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בטעינת פריטים");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(item => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (item.name || "").toLowerCase().includes(q) || (item.category || "").toLowerCase().includes(q);
  });

  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category?.trim() || "ללא קטגוריה";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const catColors = [C.purple, C.teal, C.blue, C.amber, C.red];
  const catKeys = Object.keys(grouped);

  return (
    <div style={{
      direction: "rtl", minHeight: "100vh", background: "#F5F6FA",
      padding: "16px", boxSizing: "border-box",
      fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
    }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        input:focus { border-color: #AFA9EC !important; box-shadow: 0 0 0 3px #EEEDFE !important; outline: none; }
        .item-row:hover { background: #FAFAFE !important; }

        @media (max-width: 540px) {
          .items-header { padding: 14px 16px !important; }
          .items-header-title { font-size: 18px !important; }
          .cat-header { padding: 10px 14px !important; }
          .item-row-pad { padding: 11px 14px !important; }
        }
      `}</style>

      <NewItemModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchItems} />

      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>

        {/* ── Header ── */}
        <div className="items-header" style={{
          background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14,
          padding: "18px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#534AB7", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>מערכת ניהול חשבונות</div>
            <div className="items-header-title" style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>פריטים</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>ניהול מאגר הפריטים וקטגוריות</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!loading && (
              <div style={{ background: C.gray.bg, color: C.gray.text, border: `0.5px solid ${C.gray.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>
                {items.length} פריטים
              </div>
            )}
            <button onClick={() => setModalOpen(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#534AB7", color: "#fff", border: "none",
              borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", touchAction: "manipulation", whiteSpace: "nowrap",
            }}>
              {Icon.plus} פריט חדש
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#bbb", flexShrink: 0 }}>{Icon.search}</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש לפי שם פריט או קטגוריה..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#1a1a1a", background: "transparent", fontFamily: "inherit", minWidth: 0 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "#f0f0f0", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", flexShrink: 0 }}>
              {Icon.close}
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{error}</div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, overflow: "hidden" }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ padding: "14px 18px", borderBottom: i < 5 ? "0.5px solid #f0f0f0" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton w={36} h={36} radius={8} />
                <div style={{ flex: 1 }}>
                  <Skeleton w="30%" h={13} />
                  <div style={{ marginTop: 6 }}><Skeleton w="20%" h={11} /></div>
                </div>
                <Skeleton w={60} h={24} radius={20} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
            {Icon.empty}
            <div style={{ fontSize: 15, fontWeight: 600, color: "#bbb", marginTop: 16, marginBottom: 6 }}>
              {search ? "לא נמצאו פריטים" : "אין פריטים להצגה"}
            </div>
            <div style={{ fontSize: 12, color: "#ccc", marginBottom: 20 }}>
              {search ? "נסה לחפש במילה אחרת" : "הוסף את הפריט הראשון שלך עכשיו"}
            </div>
            {!search && (
              <button onClick={() => setModalOpen(true)} style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 9, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>
                הוסף פריט ראשון
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {catKeys.map((cat, ci) => {
              const col = catColors[ci % catColors.length];
              return (
                <div key={cat} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, overflow: "hidden" }}>

                  {/* Category header */}
                  <div className="cat-header" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", borderBottom: "0.5px solid #f0f0f0", background: "#FAFAFA", flexWrap: "wrap" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: col.bg, color: col.icon, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {Icon.tag}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{cat}</span>
                    <span style={{ fontSize: 11, color: col.text, background: col.bg, borderRadius: 20, padding: "2px 10px", fontWeight: 600, marginRight: "auto" }}>
                      {grouped[cat].length} פריטים
                    </span>
                  </div>

                  {/* Items */}
                  {grouped[cat].map((item, i) => (
                    <div key={item._id} className="item-row item-row-pad" style={{
                      display: "flex", alignItems: "center", padding: "12px 18px", gap: 12,
                      borderBottom: i < grouped[cat].length - 1 ? "0.5px solid #f5f5f5" : "none",
                      background: "#fff", transition: "background 0.12s",
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: col.bg, color: col.icon, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {Icon.box}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                        {item.category && (
                          <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{item.category}</div>
                        )}
                      </div>

                      <div style={{ background: col.bg, color: col.text, borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {fmtCurrency(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
