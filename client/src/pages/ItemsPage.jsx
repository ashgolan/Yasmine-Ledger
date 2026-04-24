import { useEffect, useRef, useState } from "react";
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

// חישוב מחיר מכירה ממחיר עלות + אחוז רווח
function calcSellPrice(cost, margin) {
  const c = Number(cost || 0), m = Number(margin || 0);
  if (!c) return "";
  return String(Math.round(c * (1 + m / 100)));
}

// חישוב אחוז רווח ממחיר עלות + מחיר מכירה
function calcMargin(cost, sell) {
  const c = Number(cost || 0), s = Number(sell || 0);
  if (!c || !s) return "";
  return String(Math.round(((s - c) / c) * 100));
}

const Icon = {
  plus:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  close:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  box:     <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 2v12M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  tag:     <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 2h5l7 7-5 5-7-7V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="5" cy="5" r="1" fill="currentColor"/></svg>,
  shekel:  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 12V5a3 3 0 016 0v7M4 9h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  percent: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M13 3L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  search:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  barcode: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="2" height="10" fill="currentColor" rx="0.5"/><rect x="4" y="3" width="1" height="10" fill="currentColor" rx="0.5"/><rect x="6" y="3" width="2" height="10" fill="currentColor" rx="0.5"/><rect x="9" y="3" width="1" height="10" fill="currentColor" rx="0.5"/><rect x="11" y="3" width="2" height="10" fill="currentColor" rx="0.5"/><rect x="14" y="3" width="1" height="10" fill="currentColor" rx="0.5"/></svg>,
  scan:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1 5V2h3M12 2h3v3M1 11v3h3M12 14h3v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M1 8h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  empty:   <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M8 16l16-8 16 8v16l-16 8-16-8V16z" stroke="#ddd" strokeWidth="1.5" strokeLinejoin="round"/><path d="M24 8v32M8 16l16 8 16-8" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  edit:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  profit:  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 12l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

function Skeleton({ w, h, radius = 6 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  );
}

const inputStyle = {
  border: "0.5px solid #ddd", borderRadius: 8, padding: "9px 10px",
  fontSize: 13, color: "#1a1a1a", outline: "none", background: "#fff",
  width: "100%", boxSizing: "border-box",
  fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
};

// ─── Modal פריט חדש / עריכה ──────────────────────────────────────────────────
function ItemModal({ open, onClose, onSaved, editItem = null }) {
  const [form, setForm] = useState({ name: "", category: "", costPrice: "", profitMargin: "", price: "", barcode: "", note: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const barcodeRef = useRef();
  const scanBuffer = useRef("");
  const scanTimer = useRef(null);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "",
        category: editItem.category || "",
        costPrice: editItem.costPrice ? String(editItem.costPrice) : "",
        profitMargin: editItem.profitMargin ? String(editItem.profitMargin) : "",
        price: editItem.price ?? "",
        barcode: editItem.barcode || "",
        note: editItem.note || "",
      });
    } else {
      setForm({ name: "", category: "", costPrice: "", profitMargin: "", price: "", barcode: "", note: "" });
    }
    setError(""); setScanMode(false);
  }, [editItem, open]);

  const handleClose = () => {
    if (loading) return;
    setForm({ name: "", category: "", costPrice: "", profitMargin: "", price: "", barcode: "", note: "" });
    setError(""); setScanMode(false); onClose();
  };

  // ── חישוב אוטומטי ──
  const handleCostChange = (val) => {
    const margin = form.profitMargin;
    const newPrice = val && margin ? calcSellPrice(val, margin) : form.price;
    setForm(f => ({ ...f, costPrice: val, price: newPrice }));
  };

  const handleMarginChange = (val) => {
    const cost = form.costPrice;
    const newPrice = cost && val ? calcSellPrice(cost, val) : form.price;
    setForm(f => ({ ...f, profitMargin: val, price: newPrice }));
  };

  const handlePriceChange = (val) => {
    // אם יש מחיר עלות — חשב אחוז רווח אוטומטית
    const cost = form.costPrice;
    const newMargin = cost && val ? calcMargin(cost, val) : form.profitMargin;
    setForm(f => ({ ...f, price: val, profitMargin: newMargin }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("יש להזין שם פריט"); return; }
    if (!form.price && form.price !== 0) { setError("יש להזין מחיר מכירה"); return; }
    try {
      setLoading(true); setError("");
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        costPrice: Number(form.costPrice || 0),
        profitMargin: Number(form.profitMargin || 0),
        price: Number(form.price || 0),
        barcode: form.barcode.trim(),
        note: form.note.trim(),
      };
      if (editItem) {
        await api.put(`/items/${editItem._id}`, payload);
      } else {
        await api.post("/items", payload);
      }
      setForm({ name: "", category: "", costPrice: "", profitMargin: "", price: "", barcode: "", note: "" });
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בשמירת פריט");
    } finally { setLoading(false); }
  };

  // ── סריקת ברקוד ──
  const handleScanKeyDown = (e) => {
    if (!scanMode) return;
    clearTimeout(scanTimer.current);
    if (e.key === "Enter") {
      const code = scanBuffer.current.trim();
      if (code) { setForm(f => ({ ...f, barcode: code })); setScanMode(false); }
      scanBuffer.current = "";
      return;
    }
    if (e.key.length === 1) scanBuffer.current += e.key;
    scanTimer.current = setTimeout(() => { scanBuffer.current = ""; }, 100);
  };

  if (!open) return null;

  // חישוב רווח בשקלים לתצוגה
  const profitAmount = Number(form.price || 0) - Number(form.costPrice || 0);
  const showProfitHint = Number(form.costPrice) > 0 && Number(form.price) > 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.28)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={handleClose} onKeyDown={handleScanKeyDown} tabIndex={-1}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, padding: "24px 20px 32px", direction: "rtl", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e0e0e0", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{editItem ? "עריכת פריט" : "פריט חדש"}</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{editItem ? "עדכן פרטי הפריט" : "הוסף פריט למאגר"}</div>
          </div>
          <button onClick={handleClose} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
            {Icon.close}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* שם */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 5 }}>שם פריט *</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{Icon.box}</div>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="שם הפריט" autoFocus style={{ ...inputStyle, paddingRight: 32 }} />
            </div>
          </div>

          {/* קטגוריה */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 5 }}>קטגוריה</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{Icon.tag}</div>
              <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="לדוגמה: מזון, חשמל..." style={{ ...inputStyle, paddingRight: 32 }} />
            </div>
          </div>

          {/* ── תמחור ── */}
          <div style={{ background: "#FAFBFF", border: "0.5px solid #E8E8F0", borderRadius: 10, padding: "14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#534AB7", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              {Icon.profit} תמחור
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {/* מחיר עלות */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 5 }}>
                  מחיר עלות <span style={{ color: "#bbb", fontWeight: 400 }}>(אופציונלי)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{Icon.shekel}</div>
                  <input type="number" value={form.costPrice} onChange={e => handleCostChange(e.target.value)} placeholder="₪ עלות" style={{ ...inputStyle, paddingRight: 32 }} />
                </div>
              </div>

              {/* אחוז רווח */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 5 }}>
                  אחוז רווח <span style={{ color: "#bbb", fontWeight: 400 }}>(אופציונלי)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{Icon.percent}</div>
                  <input type="number" value={form.profitMargin} onChange={e => handleMarginChange(e.target.value)} placeholder="% רווח" style={{ ...inputStyle, paddingRight: 32 }} />
                </div>
              </div>
            </div>

            {/* חץ → */}
            {(form.costPrice || form.profitMargin) && (
              <div style={{ textAlign: "center", fontSize: 11, color: "#aaa", marginBottom: 6 }}>
                ↓ מחיר מכירה מחושב אוטומטית
              </div>
            )}

            {/* מחיר מכירה */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a", display: "block", marginBottom: 5 }}>
                מחיר מכירה *
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "#534AB7", pointerEvents: "none" }}>{Icon.shekel}</div>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => handlePriceChange(e.target.value)}
                  placeholder="₪ מכירה"
                  style={{ ...inputStyle, paddingRight: 32, borderColor: "#AFA9EC", fontWeight: 700, fontSize: 14 }}
                />
              </div>
            </div>

            {/* תצוגת רווח */}
            {showProfitHint && (
              <div style={{ marginTop: 10, background: profitAmount >= 0 ? C.teal.bg : C.red.bg, border: `0.5px solid ${profitAmount >= 0 ? C.teal.border : C.red.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: profitAmount >= 0 ? C.teal.text : C.red.text, fontWeight: 600 }}>
                  {profitAmount >= 0 ? "רווח לפריט" : "הפסד לפריט"}
                </span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {form.profitMargin && (
                    <span style={{ fontSize: 11, color: profitAmount >= 0 ? C.teal.text : C.red.text, opacity: 0.8 }}>
                      {form.profitMargin}%
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 800, color: profitAmount >= 0 ? C.teal.text : C.red.text }}>
                    {fmtCurrency(Math.abs(profitAmount))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ברקוד */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 5 }}>
              ברקוד <span style={{ color: "#bbb", fontWeight: 400 }}>(אופציונלי)</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{Icon.barcode}</div>
                <input ref={barcodeRef} type="text" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="הזן ידנית או סרוק..."
                  style={{ ...inputStyle, paddingRight: 32, borderColor: scanMode ? "#534AB7" : "#ddd", boxShadow: scanMode ? "0 0 0 3px #EEEDFE" : "none" }} />
              </div>
              <button onClick={() => { setScanMode(s => !s); setTimeout(() => barcodeRef.current?.focus(), 50); }}
                style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 8, border: `0.5px solid ${scanMode ? "#AFA9EC" : "#ddd"}`, background: scanMode ? "#EEEDFE" : "#f5f5f5", color: scanMode ? "#534AB7" : "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {Icon.scan}
              </button>
            </div>
            {scanMode && (
              <div style={{ marginTop: 8, background: C.purple.bg, border: `0.5px solid ${C.purple.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.purple.text, fontWeight: 600 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#534AB7", animation: "pulse 1s infinite" }} />
                ממתין לסריקה — כוון את הסורק לברקוד
              </div>
            )}
            {form.barcode && !scanMode && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#aaa", display: "flex", alignItems: "center", gap: 4 }}>
                {Icon.barcode}<span style={{ fontFamily: "monospace", color: "#555", fontWeight: 600 }}>{form.barcode}</span>
              </div>
            )}
          </div>

          {/* הערה */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 5 }}>
              הערה <span style={{ color: "#bbb", fontWeight: 400 }}>(אופציונלי)</span>
            </label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="הערות על הפריט..." rows={2}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </div>

          {error && <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={handleSave} disabled={loading} style={{ flex: 1, background: "#534AB7", color: "#fff", border: "none", borderRadius: 9, padding: "11px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, touchAction: "manipulation" }}>
            {loading ? "שומר..." : editItem ? "עדכן פריט" : "הוסף פריט"}
          </button>
          <button onClick={handleClose} disabled={loading} style={{ flex: 1, background: "#f5f5f5", color: "#555", border: "none", borderRadius: 9, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>
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
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");

  const globalScanBuffer = useRef("");
  const globalScanTimer = useRef(null);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (modalOpen) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      clearTimeout(globalScanTimer.current);
      if (e.key === "Enter") {
        const code = globalScanBuffer.current.trim();
        if (code.length >= 4) {
          const found = items.find(it => it.barcode === code);
          setScanResult(found ? { item: found, code } : { item: null, code });
          setTimeout(() => setScanResult(null), 3000);
        }
        globalScanBuffer.current = "";
        return;
      }
      if (e.key.length === 1) globalScanBuffer.current += e.key;
      globalScanTimer.current = setTimeout(() => { globalScanBuffer.current = ""; }, 100);
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [items, modalOpen]);

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

  const openEdit = (item) => { setEditItem(item); setModalOpen(true); };
  const openNew  = () => { setEditItem(null); setModalOpen(true); };

  const filtered = items.filter(item => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (item.name || "").toLowerCase().includes(q)
      || (item.category || "").toLowerCase().includes(q)
      || (item.barcode || "").includes(q);
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
    <div style={{ direction: "rtl", minHeight: "100vh", background: "#F5F6FA", padding: "16px", boxSizing: "border-box", fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input:focus { border-color:#AFA9EC !important; box-shadow:0 0 0 3px #EEEDFE !important; outline:none; }
        .item-row:hover { background:#FAFAFE !important; }
        .edit-btn { opacity:0; transition:opacity 0.15s; }
        .item-row:hover .edit-btn { opacity:1 !important; }
        @media (max-width:540px) {
          .items-header { padding:14px 16px !important; }
          .items-header-title { font-size:18px !important; }
          .cat-header { padding:10px 14px !important; }
          .item-row-pad { padding:11px 14px !important; }
          .edit-btn { opacity:1 !important; }
        }
      `}</style>

      <ItemModal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} onSaved={fetchItems} editItem={editItem} />

      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>

        {/* Header */}
        <div className="items-header" style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
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
            <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6, background: "#534AB7", color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", touchAction: "manipulation", whiteSpace: "nowrap" }}>
              {Icon.plus} פריט חדש
            </button>
          </div>
        </div>

        {/* Scan Toast */}
        {scanResult && (
          <div style={{ background: scanResult.item ? C.teal.bg : C.red.bg, border: `0.5px solid ${scanResult.item ? C.teal.border : C.red.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.2s ease" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: scanResult.item ? C.teal.icon : C.red.icon, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icon.barcode}</div>
            <div>
              {scanResult.item ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.teal.text }}>{scanResult.item.name}</div>
                  <div style={{ fontSize: 11, color: C.teal.text, opacity: 0.8 }}>
                    {scanResult.item.category && `${scanResult.item.category} · `}
                    {fmtCurrency(scanResult.item.price)}
                    {scanResult.item.costPrice > 0 && ` · עלות: ${fmtCurrency(scanResult.item.costPrice)}`}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.red.text }}>ברקוד לא נמצא</div>
                  <div style={{ fontSize: 11, color: C.red.text, opacity: 0.8, fontFamily: "monospace" }}>{scanResult.code}</div>
                </>
              )}
            </div>
            {!scanResult.item && (
              <button onClick={() => { setScanResult(null); setEditItem(null); setModalOpen(true); }}
                style={{ marginRight: "auto", background: C.red.icon, color: "#fff", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                הוסף פריט
              </button>
            )}
          </div>
        )}

        {/* Search */}
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#bbb", flexShrink: 0 }}>{Icon.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש לפי שם פריט, קטגוריה או ברקוד..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#1a1a1a", background: "transparent", fontFamily: "inherit", minWidth: 0 }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "#f0f0f0", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", flexShrink: 0 }}>{Icon.close}</button>
          )}
        </div>

        {error && <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        {/* Content */}
        {loading ? (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, overflow: "hidden" }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ padding: "14px 18px", borderBottom: i < 5 ? "0.5px solid #f0f0f0" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton w={36} h={36} radius={8} />
                <div style={{ flex: 1 }}><Skeleton w="30%" h={13} /><div style={{ marginTop: 6 }}><Skeleton w="20%" h={11} /></div></div>
                <Skeleton w={60} h={24} radius={20} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
            {Icon.empty}
            <div style={{ fontSize: 15, fontWeight: 600, color: "#bbb", marginTop: 16, marginBottom: 6 }}>{search ? "לא נמצאו פריטים" : "אין פריטים להצגה"}</div>
            <div style={{ fontSize: 12, color: "#ccc", marginBottom: 20 }}>{search ? "נסה לחפש במילה אחרת" : "הוסף את הפריט הראשון שלך עכשיו"}</div>
            {!search && <button onClick={openNew} style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 9, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>הוסף פריט ראשון</button>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {catKeys.map((cat, ci) => {
              const col = catColors[ci % catColors.length];
              return (
                <div key={cat} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, overflow: "hidden" }}>
                  <div className="cat-header" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", borderBottom: "0.5px solid #f0f0f0", background: "#FAFAFA", flexWrap: "wrap" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: col.bg, color: col.icon, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{Icon.tag}</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{cat}</span>
                    <span style={{ fontSize: 11, color: col.text, background: col.bg, borderRadius: 20, padding: "2px 10px", fontWeight: 600, marginRight: "auto" }}>{grouped[cat].length} פריטים</span>
                  </div>

                  {grouped[cat].map((item, i) => {
                    const hasMargin = item.costPrice > 0 && item.price > 0;
                    const marginPct = hasMargin ? Math.round(((item.price - item.costPrice) / item.costPrice) * 100) : null;
                    return (
                      <div key={item._id} className="item-row item-row-pad" style={{ display: "flex", alignItems: "center", padding: "12px 18px", gap: 12, borderBottom: i < grouped[cat].length - 1 ? "0.5px solid #f5f5f5" : "none", background: "#fff", transition: "background 0.12s", cursor: "pointer" }}
                        onClick={() => openEdit(item)}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: col.bg, color: col.icon, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{Icon.box}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                            {item.category && <span style={{ fontSize: 11, color: "#bbb" }}>{item.category}</span>}
                            {item.costPrice > 0 && (
                              <span style={{ fontSize: 10, color: C.amber.text, background: C.amber.bg, borderRadius: 4, padding: "1px 6px" }}>
                                עלות: {fmtCurrency(item.costPrice)}
                              </span>
                            )}
                            {item.barcode && (
                              <span style={{ fontSize: 10, color: C.purple.text, background: C.purple.bg, borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 3 }}>
                                {Icon.barcode} {item.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <div style={{ textAlign: "left" }}>
                            <div style={{ background: col.bg, color: col.text, borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                              {fmtCurrency(item.price)}
                            </div>
                            {marginPct !== null && (
                              <div style={{ fontSize: 10, color: marginPct >= 0 ? C.teal.text : C.red.text, textAlign: "center", marginTop: 2, fontWeight: 600 }}>
                                {marginPct >= 0 ? "↑" : "↓"} {Math.abs(marginPct)}%
                              </div>
                            )}
                          </div>
                          <div className="edit-btn" style={{ width: 28, height: 28, borderRadius: 7, background: "#f5f5f5", color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icon.edit}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
