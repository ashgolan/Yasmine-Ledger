import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios";
import { Printer, FileText, Pencil, Trash2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  purple: { bg: "#EEEDFE", border: "#AFA9EC", icon: "#534AB7", text: "#3C3489" },
  red: { bg: "#FCEBEB", border: "#F09595", icon: "#A32D2D", text: "#791F1F" },
  amber: { bg: "#FAEEDA", border: "#EF9F27", icon: "#854F0B", text: "#633806" },
  teal: { bg: "#E1F5EE", border: "#5DCAA5", icon: "#0F6E56", text: "#085041" },
  blue: { bg: "#E6F1FB", border: "#85B7EB", icon: "#185FA5", text: "#0C447C" },
};

function fmtCurrency(n) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Number(n || 0));
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL");
}
function getTypeInfo(type) {
  if (type === "debt") return { label: "חוב", color: C.red, prefix: "+" };
  if (type === "payment") return { label: "תשלום", color: C.teal, prefix: "−" };
  return { label: "החזרה", color: C.amber, prefix: "−" };
}
function newRow() {
  return { id: crypto.randomUUID(), description: "", quantity: "", unitPrice: "", amount: "", note: "", item: null };
}

const Icon = {
  wallet: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5 4V3.5a3 3 0 016 0V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="11" cy="8.5" r="1" fill="currentColor" /></svg>,
  up: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  down: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  receipt: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M6 6h4M6 9h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  print: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="4" y="1" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="2" y="6" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M5 13h6M5 10h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  edit: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  trash: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2h4v2M5 4l1 10h4l1-10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  save: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 14V3l2-1h6l2 2v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><rect x="5" y="9" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3" /></svg>,
  close: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  back: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  archive: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M2 6l2-3h8l2 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M6 9.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  note: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 2h12v9H9l-3 3V11H2V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  person: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" /><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  phone: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5L6 7a7.9 7.9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  warning: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  check: <svg width="26" height="26" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" /><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  barcode: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="2" height="10" fill="currentColor" rx="0.5" /><rect x="4" y="3" width="1" height="10" fill="currentColor" rx="0.5" /><rect x="6" y="3" width="2" height="10" fill="currentColor" rx="0.5" /><rect x="9" y="3" width="1" height="10" fill="currentColor" rx="0.5" /><rect x="11" y="3" width="2" height="10" fill="currentColor" rx="0.5" /><rect x="14" y="3" width="1" height="10" fill="currentColor" rx="0.5" /></svg>,
  scan: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 5V2h3M12 2h3v3M1 11v3h3M12 14h3v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M1 8h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  flask: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 2v5L2 13h12L10 7V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 2h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><circle cx="6" cy="11" r="0.8" fill="currentColor" /><circle cx="9" cy="10" r="0.5" fill="currentColor" /></svg>,
};

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: color.bg, color: color.icon, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color.text, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function TypeBadge({ type }) {
  const { label, color } = getTypeInfo(type);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", background: color.bg, fontSize: 11, fontWeight: 600, color: color.text }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color.icon }} />
      {label}
    </span>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  border: "0.5px solid #ddd", borderRadius: 8, padding: "8px 10px",
  fontSize: 13, color: "#1a1a1a", outline: "none",
  fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
  background: "#fff", width: "100%", boxSizing: "border-box",
};
const selectStyle = { ...inputStyle, cursor: "pointer" };

// ── Mobile Transaction Card ──
function TxCard({ t, onEdit, onDelete }) {
  const { color, prefix } = getTypeInfo(t.type);
  return (
    <div style={{ background: "#fff", border: "0.5px solid #f0f0f0", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TypeBadge type={t.type} />
          <span style={{ fontSize: 11, color: "#bbb" }}>{fmtDate(t.date)}</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: color.text }}>{prefix}{fmtCurrency(t.amount)}</span>
      </div>
      {t.description && <div style={{ fontSize: 13, color: "#444" }}>{t.description}</div>}
      {(t.quantity || t.unitPrice) && (
        <div style={{ fontSize: 11, color: "#aaa" }}>
          {t.quantity && `כמות: ${t.quantity}`}
          {t.quantity && t.unitPrice && " · "}
          {t.unitPrice && `מחיר: ₪${t.unitPrice}`}
        </div>
      )}
      {t.note && <div style={{ background: C.amber.bg, borderRadius: 7, padding: "6px 10px", fontSize: 12, color: C.amber.text }}>📝 {t.note}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <button onClick={() => onEdit(t)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: C.blue.bg, color: C.blue.text, border: "none", borderRadius: 7, padding: "7px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {Icon.edit} עריכה
        </button>
        <button onClick={() => onDelete(t._id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: C.red.bg, color: C.red.text, border: "none", borderRadius: 7, padding: "7px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {Icon.trash} מחיקה
        </button>
      </div>
    </div>
  );
}

// ── Dosage Calculator Modal ──────────────────────────────────────────────────
// ── Dosage Calculator Modal ──────────────────────────────────────────────────
function suggestMarkup(pricePerLiter, unitMl) {
  // شرائح سعر اللتر → نسبة ربح أساسية (للكميات المتوسطة-الكبيرة, >100ml)
  let baseMargin;
  if (pricePerLiter <= 100) baseMargin = 1.00;       // 100%
  else if (pricePerLiter <= 300) baseMargin = 0.70;  // 70%
  else if (pricePerLiter <= 600) baseMargin = 0.50;  // 50%
  else if (pricePerLiter <= 1000) baseMargin = 0.35; // 35%
  else baseMargin = 0.20;                             // 20%

  // معامل تصحيح حسب حجم الوحدة המוצעת
  let sizeFactor;
  if (unitMl <= 50) sizeFactor = 1.5;
  else if (unitMl <= 100) sizeFactor = 1.25;
  else if (unitMl <= 300) sizeFactor = 1.0;
  else sizeFactor = 0.8;

  const margin = baseMargin * sizeFactor; // נדגיש: זה % רווח, לא מקדם!
  const markup = 1 + margin;              // מקדם = פי כמה מהעלות
  return Math.round(markup * 100) / 100;
}

function CalcModal({ open, onClose, items, onAdd }) {
  const [itemId, setItemId] = useState("");
  const [containerLiters, setContainerLiters] = useState("");
  const [sellMode, setSellMode] = useState("10ml"); // "10ml" | "100ml" | "custom"
  const [customUnitMl, setCustomUnitMl] = useState("50");
  const [markup10, setMarkup10] = useState(3);
  const [markup100, setMarkup100] = useState(2);
  const [markupCustom, setMarkupCustom] = useState(2.5);
  const [customerMl, setCustomerMl] = useState("");
  const [roundPrice, setRoundPrice] = useState(true);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [suggestionApplied, setSuggestionApplied] = useState(false);

  useEffect(() => {
    if (open) {
      setItemId(""); setContainerLiters(""); setCustomerMl("");
      setSellMode("10ml"); setAutoSuggest(true); setSuggestionApplied(false);
    }
  }, [open]);

  // Filter by category חקלאות
  const agriItems = items.filter(it =>
    it.category === "חקלאות" || it.category === "agriculture" || it.category === "agri"
  );
  const displayItems = agriItems.length > 0 ? agriItems : items;

  const selectedItem = items.find(it => it._id === itemId);
  const itemPrice = Number(selectedItem?.price || 0);
  const liters = Number(containerLiters) || 0;
  const ml = Number(customerMl) || 0;
  const pricePerLiter = liters > 0 && itemPrice > 0 ? itemPrice / liters : 0;

  // Unit calculations
  let unitMl = sellMode === "10ml" ? 10 : sellMode === "100ml" ? 100 : Number(customUnitMl) || 50;

  // ── הצעת מקדם אוטומטית ──
  const suggestedMarkup = pricePerLiter > 0 && ml > 0 ? suggestMarkup(pricePerLiter, ml) : null;

  // החל הצעה אוטומטית כשמשתנים הנתונים הרלוונטיים, אם autoSuggest פעיל
  useEffect(() => {
    if (!autoSuggest || !suggestedMarkup) return;
    if (sellMode === "10ml") setMarkup10(suggestedMarkup);
    else if (sellMode === "100ml") setMarkup100(suggestedMarkup);
    else setMarkupCustom(suggestedMarkup);
    setSuggestionApplied(true);
  }, [suggestedMarkup, sellMode, autoSuggest]);

  let markup = sellMode === "10ml" ? markup10 : sellMode === "100ml" ? markup100 : markupCustom;
  const unitPriceRaw = pricePerLiter > 0 ? (pricePerLiter * unitMl / 1000) * markup : 0;
  const unitsCount = unitMl > 0 ? ml / unitMl : 0;
  const totalRaw = unitsCount * unitPriceRaw;
  const totalFinal = roundPrice ? Math.ceil(totalRaw * 2) / 2 : Math.round(totalRaw * 100) / 100;
  const costPerUnit = pricePerLiter > 0 ? (pricePerLiter * unitMl / 1000) : 0;
  const profitPct = costPerUnit > 0 ? ((unitPriceRaw - costPerUnit) / costPerUnit * 100).toFixed(0) : 0;

  const isValid = selectedItem && liters > 0 && ml > 0 && totalFinal > 0;

  const handleManualMarkupChange = (v) => {
    setAutoSuggest(false); // המשתמש שינה ידנית — בטל את ההצעה האוטומטית
    if (sellMode === "10ml") setMarkup10(v);
    else if (sellMode === "100ml") setMarkup100(v);
    else setMarkupCustom(v);
  };

  const handleResetToSuggestion = () => {
    if (!suggestedMarkup) return;
    setAutoSuggest(true);
    if (sellMode === "10ml") setMarkup10(suggestedMarkup);
    else if (sellMode === "100ml") setMarkup100(suggestedMarkup);
    else setMarkupCustom(suggestedMarkup);
  };

  const handleAdd = () => {
    if (!isValid) return;
    onAdd({
      description: `${selectedItem.name} — ${ml} מ״ל`,
      amount: totalFinal,
      unitPrice: Math.round(unitPriceRaw * 100) / 100,
      itemId: selectedItem._id,
    });
    onClose();
  };

  const modes = [
    { value: "10ml", label: "10 מ״ל", sub: `× ${markup10}`, color: C.purple },
    { value: "100ml", label: "100 מ״ל", sub: `× ${markup100}`, color: C.teal },
    { value: "custom", label: "מותאם", sub: `× ${markupCustom}`, color: C.amber },
  ];

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460, maxHeight: "90vh", overflow: "auto", direction: "rtl", boxShadow: "0 28px 70px rgba(83,74,183,0.18)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #534AB7 0%, #6B5CE7 100%)", borderRadius: "20px 20px 0 0", padding: "20px 20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🧪</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>מחשבון מינונים</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>חישוב מחיר לכמויות קטנות</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              {Icon.close}
            </button>
          </div>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Step 1: Product */}
            <div style={{ background: "#FAFBFF", border: "0.5px solid #E8E8F0", borderRadius: 12, padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: C.purple.bg, color: C.purple.icon, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>1</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>בחר מוצר {agriItems.length > 0 ? "(חקלאות)" : "(כל הפריטים)"}</span>
              </div>
              <select value={itemId} onChange={e => setItemId(e.target.value)} style={{ ...selectStyle }}>
                <option value="">— בחר פריט —</option>
                {displayItems.map(it => (
                  <option key={it._id} value={it._id}>{it.name}{it.price ? ` — ₪${it.price}` : ""}</option>
                ))}
              </select>
              {selectedItem && (
                <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ background: C.purple.bg, borderRadius: 7, padding: "5px 10px", fontSize: 12 }}>
                    <span style={{ color: "#888" }}>מחיר אריזה: </span>
                    <span style={{ fontWeight: 700, color: C.purple.text }}>₪{selectedItem.price}</span>
                  </div>
                  {selectedItem.costPrice && (
                    <div style={{ background: C.teal.bg, borderRadius: 7, padding: "5px 10px", fontSize: 12 }}>
                      <span style={{ color: "#888" }}>עלות: </span>
                      <span style={{ fontWeight: 700, color: C.teal.text }}>₪{selectedItem.costPrice}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Container size */}
            <div style={{ background: "#FAFBFF", border: "0.5px solid #E8E8F0", borderRadius: 12, padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: C.blue.bg, color: C.blue.icon, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>2</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>נפח האריזה</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="number" value={containerLiters} onChange={e => setContainerLiters(e.target.value)}
                  placeholder="5" min="0" step="0.1"
                  style={{ ...inputStyle, flex: 1 }} />
                <span style={{ fontSize: 13, color: "#888", fontWeight: 600, flexShrink: 0 }}>ליטר</span>
              </div>
              {pricePerLiter > 0 && (
                <div style={{ marginTop: 10, background: C.blue.bg, border: `0.5px solid ${C.blue.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.blue.text, fontWeight: 600 }}>מחיר ל-1 ליטר</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: C.blue.text }}>₪{pricePerLiter.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Step 3: Customer quantity (moved up — needed for suggestion) */}
            <div style={{ background: "#FAFBFF", border: "0.5px solid #E8E8F0", borderRadius: 12, padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: C.teal.bg, color: C.teal.icon, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>3</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>כמות ללקוח</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="number" value={customerMl} onChange={e => setCustomerMl(e.target.value)}
                  placeholder="150" min="1"
                  style={{ ...inputStyle, flex: 1, fontSize: 16, fontWeight: 600, textAlign: "center" }} />
                <span style={{ fontSize: 13, color: "#888", fontWeight: 600, flexShrink: 0 }}>מ״ל</span>
              </div>
            </div>

            {/* Step 4: Selling mode + markup (with auto-suggestion) */}
            <div style={{ background: "#FAFBFF", border: "0.5px solid #E8E8F0", borderRadius: 12, padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: C.amber.bg, color: C.amber.icon, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>4</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>אופן מכירה ומקדם רווח</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {modes.map(m => (
                  <button key={m.value} onClick={() => setSellMode(m.value)}
                    style={{ flex: 1, padding: "9px 6px", borderRadius: 9, border: `1.5px solid ${sellMode === m.value ? m.color.border : "#e0e0e0"}`, background: sellMode === m.value ? m.color.bg : "#f9f9f9", cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sellMode === m.value ? m.color.text : "#666" }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: sellMode === m.value ? m.color.icon : "#bbb", marginTop: 1 }}>מקדם {m.sub}</div>
                  </button>
                ))}
              </div>

              {/* Auto-suggestion banner */}
              {suggestedMarkup && (
                <div style={{ marginBottom: 10, background: autoSuggest ? C.purple.bg : "#f5f5f5", border: `0.5px solid ${autoSuggest ? C.purple.border : "#ddd"}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>💡</span>
                    <span style={{ fontSize: 11, color: autoSuggest ? C.purple.text : "#888", fontWeight: 600 }}>
                      {autoSuggest ? `מקדם מוצע אוטומטית: × ${suggestedMarkup}` : `מקדם מוצע: × ${suggestedMarkup} (לא הופעל)`}
                    </span>
                  </div>
                  {!autoSuggest && (
                    <button onClick={handleResetToSuggestion} style={{ background: C.purple.icon, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                      החל הצעה
                    </button>
                  )}
                </div>
              )}

              {/* Custom unit + editable markup */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {sellMode === "custom" && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1 }}>
                    <span style={{ fontSize: 11, color: "#888", flexShrink: 0 }}>וחידה (מ״ל):</span>
                    <input type="number" value={customUnitMl} onChange={e => setCustomUnitMl(e.target.value)}
                      min="1" style={{ ...inputStyle, width: 70, textAlign: "center" }} />
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, alignItems: "center", flex: sellMode === "custom" ? "none" : 1 }}>
                  <span style={{ fontSize: 11, color: "#888", flexShrink: 0 }}>מקדם:</span>
                  <input type="number"
                    value={markup}
                    onChange={e => handleManualMarkupChange(Number(e.target.value))}
                    min="1" step="0.1"
                    style={{ ...inputStyle, width: 65, textAlign: "center" }} />
                </div>
              </div>

              {/* Price per unit preview */}
              {unitPriceRaw > 0 && (
                <div style={{ marginTop: 10, background: C.amber.bg, border: `0.5px solid ${C.amber.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.amber.text, fontWeight: 600 }}>מחיר ל-{unitMl} מ״ל</span>
                  <div style={{ textAlign: "left" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.amber.text }}>₪{unitPriceRaw.toFixed(3)}</span>
                    {costPerUnit > 0 && <span style={{ fontSize: 10, color: C.teal.text, marginRight: 8 }}>רווח {profitPct}%</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Round toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "0 2px" }} onClick={() => setRoundPrice(r => !r)}>
              <div style={{ width: 32, height: 18, borderRadius: 9, background: roundPrice ? C.purple.icon : "#ddd", transition: "background 0.2s", position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 2, right: roundPrice ? 2 : 14, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "right 0.2s" }} />
              </div>
              <span style={{ fontSize: 11, color: "#888" }}>עגל מחיר לחצי שקל קרוב</span>
            </div>

            {/* Result card */}
            {isValid && (
              <div style={{ background: "linear-gradient(135deg, #EEEDFE 0%, #E6F1FB 100%)", border: `1.5px solid ${C.purple.border}`, borderRadius: 14, padding: "16px", animation: "fadeIn 0.2s ease" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.purple.text, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>תוצאת החישוב</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555" }}>
                    <span>מחיר ל-{unitMl} מ״ל</span>
                    <span style={{ fontWeight: 600 }}>₪{unitPriceRaw.toFixed(3)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555" }}>
                    <span>מספר יחידות ({ml} ÷ {unitMl})</span>
                    <span style={{ fontWeight: 600 }}>{unitsCount % 1 === 0 ? unitsCount : unitsCount.toFixed(1)} יח׳</span>
                  </div>
                  {roundPrice && totalRaw !== totalFinal && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa" }}>
                      <span>לפני עיגול</span>
                      <span>₪{totalRaw.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ height: 1, background: `${C.purple.border}`, margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.purple.text }}>סה״כ לחיוב</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: C.purple.text }}>₪{totalFinal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={onClose}
              style={{ background: "#f5f5f5", color: "#555", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ביטול
            </button>
            <button onClick={handleAdd} disabled={!isValid}
              style={{ flex: 1, background: isValid ? C.purple.icon : "#ddd", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: isValid ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.15s" }}>
              {Icon.plus} הוסף לרשימה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Customer Modal ──
function EditCustomerModal({ open, onClose, customer, onSaved, knownLastNames = [] }) {
  const [form, setForm] = useState({ fullName: "", phone: "", idNumber: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  useEffect(() => {
    if (open && customer) {
      setForm({ fullName: customer.fullName || "", phone: customer.phone || "", idNumber: customer.idNumber || "" });
      setError(""); setSuggestions([]); setShowSuggestions(false);
    }
  }, [open, customer]);

  const handleClose = () => { if (loading) return; onClose(); };
  const handleSave = async () => {
    if (!form.fullName.trim()) { setError("יש להזין שם לקוח"); return; }
    try {
      setLoading(true); setError("");
      await api.put(`/customers/${customer._id}`, { fullName: form.fullName.trim(), phone: form.phone.trim(), idNumber: form.idNumber.trim() });
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.message || "שגיאה בעדכון פרטי הלקוח"); }
    finally { setLoading(false); }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, fullName: val });
    setActiveSuggestion(-1);
    const parts = val.split(/\s+/);
    if (parts.length >= 2 && parts[parts.length - 1].length >= 1) {
      const lastPart = parts[parts.length - 1].toLowerCase();
      const filtered = knownLastNames.filter(ln => ln.toLowerCase().startsWith(lastPart) && ln.toLowerCase() !== lastPart);
      setSuggestions(filtered.slice(0, 6));
      setShowSuggestions(filtered.length > 0);
    } else { setSuggestions([]); setShowSuggestions(false); }
  };

  const applySuggestion = (lastName) => {
    const parts = form.fullName.trim().split(/\s+/);
    parts[parts.length - 1] = lastName;
    setForm({ ...form, fullName: parts.join(" ") });
    setSuggestions([]); setShowSuggestions(false); setActiveSuggestion(-1);
  };

  const handleNameKeyDown = (e) => {
    if (!showSuggestions) { if (e.key === "Enter") handleSave(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveSuggestion(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") { e.preventDefault(); activeSuggestion >= 0 ? applySuggestion(suggestions[activeSuggestion]) : handleSave(); }
    else if (e.key === "Escape") { setSuggestions([]); setShowSuggestions(false); }
    else if (e.key === "Tab" && activeSuggestion >= 0) { e.preventDefault(); applySuggestion(suggestions[activeSuggestion]); }
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.32)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={handleClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, padding: "24px 20px", direction: "rtl", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>עריכת פרטי לקוח</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>עדכן את שם הלקוח או מספר הטלפון</div>
          </div>
          <button onClick={handleClose} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>{Icon.close}</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>שם מלא *</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", right: 11, transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", zIndex: 1 }}>{Icon.person}</div>
              <input autoFocus value={form.fullName} onChange={handleNameChange} onKeyDown={handleNameKeyDown}
                onBlur={() => setTimeout(() => { setSuggestions([]); setShowSuggestions(false); }, 150)}
                placeholder="ישראל ישראלי" autoComplete="off" style={{ ...inputStyle, paddingRight: 36 }} />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0, zIndex: 200, background: "#fff", border: "0.5px solid #e0ddf8", borderRadius: 10, boxShadow: "0 6px 24px rgba(83,74,183,0.10)", overflow: "hidden" }}>
                  <div style={{ padding: "6px 10px 4px", fontSize: 10, color: "#aaa", fontWeight: 600, borderBottom: "0.5px solid #f0f0f0", letterSpacing: "0.04em" }}>משפחות מוכרות</div>
                  {suggestions.map((ln, idx) => {
                    const typed = form.fullName.trim().split(/\s+/).pop();
                    return (
                      <div key={ln} onMouseDown={() => applySuggestion(ln)} onMouseEnter={() => setActiveSuggestion(idx)}
                        style={{ padding: "9px 14px", fontSize: 13, cursor: "pointer", background: idx === activeSuggestion ? "#EEEDFE" : "transparent", color: idx === activeSuggestion ? "#3C3489" : "#1a1a1a", display: "flex", alignItems: "center", gap: 4, fontWeight: idx === activeSuggestion ? 600 : 400, transition: "background 0.1s" }}>
                        <span style={{ color: "#534AB7", fontWeight: 700 }}>{ln.slice(0, typed.length)}</span>
                        <span>{ln.slice(typed.length)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>טלפון</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", right: 11, transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }}>{Icon.phone}</div>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="050-0000000" style={{ ...inputStyle, paddingRight: 36 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>
              תעודת זהות <span style={{ color: "#bbb", fontWeight: 400 }}>(אופציונלי)</span>
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", right: 11, transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M8 7h4M8 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </div>
              <input value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="000000000" maxLength={20} style={{ ...inputStyle, paddingRight: 36, fontFamily: "monospace, Arial", letterSpacing: "0.05em" }} />
            </div>
          </div>
          {error && <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 600 }}>{error}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={handleSave} disabled={loading} style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "שומר..." : "שמור שינויים"}
          </button>
          <button onClick={handleClose} disabled={loading} style={{ background: "#f5f5f5", color: "#555", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Customer Modal ──
function DeleteCustomerModal({ open, onClose, customer, stats, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => { if (open) { setError(""); setConfirmed(false); } }, [open]);

  const handleDelete = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    try {
      setLoading(true); setError("");
      await api.delete(`/customers/${customer._id}`);
      onDeleted();
    } catch (err) { setError(err.response?.data?.message || "שגיאה במחיקת הלקוח"); setLoading(false); }
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => { if (!loading) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 440, padding: "28px 24px", direction: "rtl", animation: "fadeIn 0.2s ease", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: C.red.bg, color: C.red.icon, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: `1.5px solid ${C.red.border}` }}>{Icon.warning}</div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>מחיקת לקוח</div>
          <div style={{ fontSize: 14, color: "#666", lineHeight: 1.7 }}>האם אתה בטוח שברצונך למחוק את<br /><strong style={{ color: "#1a1a1a" }}>{customer?.fullName}</strong>?</div>
        </div>
        <div style={{ background: "#FAFAFA", border: "0.5px solid #eee", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>מה יימחק לצמיתות</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[["🧾", "עסקאות בחשבון הנוכחי", stats?.transactions], ["📦", "חשבונות בארכיון", stats?.archivedAccounts], ["📋", "הצעות מחיר", stats?.quotes], ["🚚", "תעודות משלוח", stats?.deliveryNotes]].map(([emoji, label, val]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 15 }}>{emoji}</span> {label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.red.text }}>{val ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: C.red.bg, border: `0.5px solid ${C.red.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: C.red.text, lineHeight: 1.6, fontWeight: 600 }}>
          ⚠️ פעולה זו אינה ניתנת לביטול. כל הנתונים יימחקו לצמיתות.
        </div>
        {error && <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { if (!loading) onClose(); }} disabled={loading} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "0.5px solid #ddd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#666", cursor: loading ? "not-allowed" : "pointer" }}>ביטול</button>
          <button onClick={handleDelete} disabled={loading} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: confirmed ? C.red.icon : C.red.bg, color: confirmed ? "#fff" : C.red.text, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {Icon.trash} {loading ? "מוחק..." : confirmed ? "אשר מחיקה סופית" : "מחק לקוח"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState(0);
  const [archivedAccounts, setArchivedAccounts] = useState([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archiveDetailLoading, setArchiveDetailLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);

  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [deleteStats, setDeleteStats] = useState(null);
  const [profitOpen, setProfitOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinShake, setPinShake] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  const handlePinSubmit = async () => {
    if (!pinCode.trim()) return;
    try {
      setPinLoading(true); setPinError("");
      await api.post("/auth/verify-lock-code", { lockCode: pinCode });
      setPinOpen(false); setPinCode(""); setPinError("");
      setProfitOpen(true);
    } catch {
      setPinError("קוד שגוי, נסה שוב");
      setPinShake(true);
      setTimeout(() => setPinShake(false), 450);
      setPinCode("");
    } finally { setPinLoading(false); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const [batchType, setBatchType] = useState("debt");
  const [batchDate, setBatchDate] = useState(today);
  const [batchRows, setBatchRows] = useState([newRow()]);
  const batchTotal = batchRows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const validCount = batchRows.filter(r => Number(r.amount || 0) > 0).length;

  const [scanMode, setScanMode] = useState(false);
  const [scanToast, setScanToast] = useState(null);
  const scanBuffer = useRef("");
  const scanTimer = useRef(null);
  const scanToastTimer = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [allCustomers, setAllCustomers] = useState([]);
  const knownLastNames = useMemo(() => {
    const set = new Set();
    allCustomers.forEach(c => {
      const parts = (c.fullName || "").trim().split(/\s+/);
      if (parts.length >= 2) set.add(parts[parts.length - 1]);
    });
    return [...set];
  }, [allCustomers]);

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError("");
      const [accRes, itemsRes, settingsRes, archRes, custsRes] = await Promise.all([
        api.get(`/accounts/customer/${customerId}/open`),
        api.get("/items"),
        api.get("/settings"),
        api.get(`/accounts/customer/${customerId}/archived`),
        api.get("/customers"),
      ]);
      setData(accRes.data);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setSettings(settingsRes.data);
      setArchivedAccounts(Array.isArray(archRes.data) ? archRes.data : []);
      setAllCustomers(Array.isArray(custsRes.data) ? custsRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בטעינת הנתונים");
    } finally { if (isInitial) setLoading(false); }
  };

  useEffect(() => { if (customerId) fetchData(true); }, [customerId]);

  useEffect(() => {
    if (!scanMode) return;
    const handleKey = (e) => {
      clearTimeout(scanTimer.current);
      if (e.key === "Enter") {
        const code = scanBuffer.current.trim();
        scanBuffer.current = "";
        if (code.length < 2) return;
        const match = items.find(it => it.barcode === code);
        if (match) {
          setBatchRows(prev => {
            const emptyIdx = prev.findIndex(r => !r.description);
            const qty = Number(prev[emptyIdx >= 0 ? emptyIdx : 0].quantity || 1);
            const amt = qty && match.price ? qty * match.price : match.price || 0;
            const updated = { ...prev[emptyIdx >= 0 ? emptyIdx : 0], description: match.name, unitPrice: String(match.price || ""), amount: String(amt), item: match._id };
            if (emptyIdx >= 0) { const next = [...prev]; next[emptyIdx] = updated; return next; }
            return [...prev, { ...newRow(), ...updated }];
          });
          setScanToast({ found: true, name: match.name, price: match.price, code });
        } else { setScanToast({ found: false, code }); }
        setScanMode(false);
        clearTimeout(scanToastTimer.current);
        scanToastTimer.current = setTimeout(() => setScanToast(null), 3000);
        return;
      }
      if (e.key.length === 1) scanBuffer.current += e.key;
      scanTimer.current = setTimeout(() => { scanBuffer.current = ""; }, 80);
    };
    window.addEventListener("keydown", handleKey, true);
    return () => { window.removeEventListener("keydown", handleKey, true); clearTimeout(scanTimer.current); };
  }, [scanMode, items]);

  // Handle adding from CalcModal to batch rows
  const handleCalcAdd = ({ description, amount, unitPrice, itemId }) => {
    setBatchRows(prev => {
      const emptyIdx = prev.findIndex(r => !r.description && !r.amount);
      const row = { id: crypto.randomUUID(), description, quantity: "", unitPrice: String(Math.round(unitPrice * 100) / 100), amount: String(amount), note: "", item: itemId || null, sharedNote: prev[0]?.sharedNote || "" };
      if (emptyIdx >= 0) { const next = [...prev]; next[emptyIdx] = row; return next; }
      return [...prev, row];
    });
  };

  const updateRow = (id, patch) => {
    setBatchRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const next = { ...row, ...patch };
      const q = Number(next.quantity || 0), p = Number(next.unitPrice || 0);
      if (q && p) next.amount = String(q * p);
      return next;
    }));
  };
  const addRow = () => setBatchRows(prev => [...prev, newRow()]);
  const removeRow = (id) => { if (batchRows.length > 1) setBatchRows(prev => prev.filter(r => r.id !== id)); };
  const resetBatch = () => { setBatchRows([newRow()]); setBatchDate(today); };

  const handleAddAll = async () => {
    const valid = batchRows.filter(r => Number(r.amount || 0) > 0);
    if (!valid.length) { setError("יש להזין סכום לפחות בשורה אחת"); return; }
    const sharedNote = batchRows[0]?.sharedNote || "";
    try {
      setAdding(true); setError("");
      let lastRes;
      for (const row of valid) {
        lastRes = await api.post("/transactions", {
          accountId: data?.account?._id,
          type: batchType, date: batchDate === today ? new Date().toISOString() : new Date(batchDate + "T12:00:00").toISOString(),
          description: row.description, quantity: Number(row.quantity || 0), unitPrice: Number(row.unitPrice || 0),
          amount: Number(row.amount), note: sharedNote, item: row.item || null,
        });
      }
      resetBatch();
      await fetchData();
      if (lastRes?.data?.shouldAskArchive) setShowArchivePrompt(true);
    } catch (err) { setError(err.response?.data?.message || "שגיאה בהוספת עסקאות"); }
    finally { setAdding(false); }
  };

  const startEdit = (t) => { setEditingId(t._id); setEditForm({ date: t.date ? new Date(t.date).toISOString().slice(0, 10) : "", type: t.type, description: t.description || "", quantity: t.quantity ?? "", unitPrice: t.unitPrice ?? "", amount: t.amount ?? "", note: t.note || "" }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const handleEditChange = (field, value) => {
    const next = { ...editForm, [field]: value };
    if ((field === "quantity" || field === "unitPrice") && next.type !== "payment") {
      const q = Number(next.quantity || 0), p = Number(next.unitPrice || 0);
      if (q && p) next.amount = q * p;
    }
    setEditForm(next);
  };
  const saveEdit = async (id) => {
    try { await api.put(`/transactions/${id}`, editForm); setEditingId(null); setEditForm({}); await fetchData(); }
    catch (err) { setError(err.response?.data?.message || "שגיאה בעדכון"); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("האם למחוק את השורה?")) return;
    try { await api.delete(`/transactions/${id}`); await fetchData(); }
    catch (err) { setError(err.response?.data?.message || "שגיאה במחיקה"); }
  };

  const handleArchive = async () => {
    try {
      setArchiving(true);
      const accountId = data?.account?._id;
      if (!accountId) { setError("לא נמצא מזהה חשבון"); return; }
      await api.post(`/accounts/archive/${accountId}`);
      setShowArchivePrompt(false); setTab(1); await fetchData();
    } catch (err) { setError(err.response?.data?.message || "שגיאה בארכוב החשבון"); }
    finally { setArchiving(false); }
  };

  const openDeleteModal = async () => {
    setDeleteStats(null); setDeleteCustomerOpen(true);
    try {
      const txCount = data?.transactions?.length ?? 0;
      const archCount = archivedAccounts.length ?? 0;
      let quotesCount = "—", deliveryCount = "—";
      try { const r = await api.get(`/quotes/customer/${customerId}/count`); quotesCount = r.data?.count ?? 0; } catch { }
      try { const r = await api.get(`/delivery-notes/customer/${customerId}/count`); deliveryCount = r.data?.count ?? 0; } catch { }
      setDeleteStats({ transactions: txCount, archivedAccounts: archCount, quotes: quotesCount, deliveryNotes: deliveryCount });
    } catch { setDeleteStats({ transactions: "—", archivedAccounts: "—", quotes: "—", deliveryNotes: "—" }); }
  };

  const handlePrint = () => {
    if (!data) return;
    const { transactions, balance } = data;
    const customerName = data?.account?.customer?.fullName || "לקוח";
    const customerPhone = data?.account?.customer?.phone || "";
    const debtsTotal = transactions.filter(t => t.type === "debt").reduce((s, t) => s + Number(t.amount || 0), 0);
    const paymentsTotal = transactions.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
    const returnsTotal = transactions.filter(t => t.type === "return").reduce((s, t) => s + Number(t.amount || 0), 0);
    const rows = transactions.map(t => `<tr><td>${fmtDate(t.date)}</td><td>${getTypeInfo(t.type).label}</td><td>${t.description || "—"}</td><td>${t.type === "payment" ? "—" : t.quantity || "—"}</td><td>${t.type === "payment" ? "—" : t.unitPrice || "—"}</td><td>${Number(t.amount || 0).toLocaleString("he-IL")} ₪</td><td class="note-cell">${t.note ? `📝 ${t.note}` : "—"}</td></tr>`).join("");
    const logoBanner = settings?.logoBase64 ? `<div class="logo-banner"><img src="${settings.logoBase64}" style="max-height:90px;max-width:100%;object-fit:contain"/></div>` : `<div class="logo-banner logo-text">${settings?.storeName || ""}</div>`;
    const storeInfo = [settings?.storePhone ? `טלפון: ${settings.storePhone}` : "", settings?.storeAddress || ""].filter(Boolean).join(" · ");
    const customer = data?.account?.customer;
    const w = window.open("", "_blank", "width=1000,height=800");
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>חשבון לקוח — ${customerName}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;direction:rtl;color:#111;background:#fff}.logo-banner{width:100%;background:#f8f8f8;border-bottom:2px solid #eee;display:flex;align-items:center;justify-content:center;padding:18px 32px;min-height:80px}.logo-text{font-size:26px;font-weight:800;color:#1a1a1a}.store-info{text-align:center;font-size:12px;color:#888;padding:7px 32px 10px;border-bottom:1px solid #f0f0f0}.details{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 32px;border-bottom:1px solid #eee;font-size:12px;color:#555;line-height:1.9}.details strong{color:#111;font-size:13px}.details-right{text-align:right}.details-left{text-align:left;color:#666}.content{padding:0 32px 32px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:9px 11px;text-align:right;font-size:13px}th{background:#f5f5f5;font-weight:700;color:#444}.note-cell{font-size:11px;color:#777;max-width:160px;word-break:break-word}tr:nth-child(even){background:#fafafa}.summary{margin-top:20px;border:1px solid #eee;border-radius:8px;overflow:hidden}.summary-row{display:flex;justify-content:space-between;padding:9px 16px;font-size:13px;border-bottom:1px solid #f0f0f0}.summary-row:last-child{border-bottom:none}.summary-row.total{background:#f5f5f5;font-size:16px;font-weight:800}.debt-color{color:#A32D2D}.pay-color{color:#0F6E56}.bal-color{color:#534AB7}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center}</style></head><body>${logoBanner}${storeInfo ? `<div class="store-info">${storeInfo}</div>` : ""}<div class="details"><div class="details-right"><div>לקוח: <strong>${customerName}</strong></div>${customerPhone ? `<div>טלפון: <strong>${customerPhone}</strong></div>` : ""}${customer?.idNumber ? `<div>ת.ז.: <strong>${customer.idNumber}</strong></div>` : ""}</div><div class="details-left"><div>תאריך הדפסה: <strong>${fmtDate(new Date())}</strong></div></div></div><div class="content"><table><thead><tr><th>תאריך</th><th>סוג</th><th>תיאור</th><th>כמות</th><th>מחיר</th><th>סכום</th><th>הערה</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div class="summary-row"><span>סה״כ חובות</span><span class="debt-color">${debtsTotal.toLocaleString("he-IL")} ₪</span></div><div class="summary-row"><span>סה״כ תשלומים</span><span class="pay-color">${paymentsTotal.toLocaleString("he-IL")} ₪</span></div><div class="summary-row"><span>סה״כ החזרות</span><span class="pay-color">${returnsTotal.toLocaleString("he-IL")} ₪</span></div><div class="summary-row total"><span>יתרת חוב</span><span class="bal-color">${Number(balance || 0).toLocaleString("he-IL")} ₪</span></div></div>${settings?.footerText ? `<div class="footer">${settings.footerText}</div>` : ""}</div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const handleExportPDF = () => {
    if (!data) return;
    const { transactions, balance } = data;
    const customerName = data?.account?.customer?.fullName || "לקוח";
    const customerPhone = data?.account?.customer?.phone || "";
    const customer = data?.account?.customer;
    const debtsTotal = transactions.filter(t => t.type === "debt").reduce((s, t) => s + Number(t.amount || 0), 0);
    const paymentsTotal = transactions.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
    const returnsTotal = transactions.filter(t => t.type === "return").reduce((s, t) => s + Number(t.amount || 0), 0);
    const rows = transactions.map(t => `<tr><td>${fmtDate(t.date)}</td><td>${getTypeInfo(t.type).label}</td><td>${t.description || "—"}</td><td>${t.type === "payment" ? "—" : t.quantity || "—"}</td><td>${t.type === "payment" ? "—" : t.unitPrice || "—"}</td><td>${Number(t.amount || 0).toLocaleString("he-IL")} ₪</td><td>${t.note ? `📝 ${t.note}` : "—"}</td></tr>`).join("");
    const logoBanner = settings?.logoBase64 ? `<div class="logo-banner"><img src="${settings.logoBase64}" style="max-height:90px;max-width:100%;object-fit:contain"/></div>` : `<div class="logo-banner logo-text">${settings?.storeName || ""}</div>`;
    const storeInfo = [settings?.storePhone ? `📞 ${settings.storePhone}` : null, settings?.storeAddress ? `📍 ${settings.storeAddress}` : null].filter(Boolean).join("  •  ");
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"/><title>מצב חשבון — ${customerName}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,'Arial Hebrew',sans-serif;direction:rtl;color:#1a1a1a;font-size:12px;padding:24px}.logo-banner{text-align:center;margin-bottom:10px}.logo-text{font-size:22px;font-weight:800;color:#534AB7}.store-info{text-align:center;color:#888;font-size:11px;margin-bottom:14px}.title{font-size:16px;font-weight:800;color:#534AB7;text-align:center;margin-bottom:14px;border-bottom:2px solid #EEEDFE;padding-bottom:10px}.details{display:flex;justify-content:space-between;margin-bottom:14px;background:#f9f9f9;border-radius:8px;padding:10px 14px}.details div{font-size:12px;color:#555;margin-bottom:3px}.details strong{color:#1a1a1a}table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px}th{background:#534AB7;color:#fff;padding:7px 8px;text-align:right;font-weight:700}td{padding:6px 8px;border-bottom:0.5px solid #f0f0f0;color:#333}tr:nth-child(even) td{background:#fafafa}.summary{margin-top:10px;border:0.5px solid #e8e8e8;border-radius:8px;overflow:hidden}.summary-row{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:0.5px solid #f0f0f0;font-size:12px}.summary-row:last-child{border-bottom:none}.summary-row.total{background:#EEEDFE;font-weight:800;font-size:13px}.debt-color{color:#A32D2D;font-weight:700}.pay-color{color:#0F6E56;font-weight:700}.bal-color{color:#534AB7;font-weight:700}.footer{text-align:center;margin-top:18px;padding-top:10px;border-top:0.5px solid #eee;color:#aaa;font-size:10px}@media print{@page{margin:10mm}body{padding:0}}</style></head><body>${logoBanner}${storeInfo ? `<div class="store-info">${storeInfo}</div>` : ""}<div class="title">כרטיס לקוח — מצב חשבון</div><div class="details"><div><div>לקוח: <strong>${customerName}</strong></div>${customerPhone ? `<div>טלפון: <strong>${customerPhone}</strong></div>` : ""}${customer?.idNumber ? `<div>ת.ז.: <strong>${customer.idNumber}</strong></div>` : ""}</div><div style="text-align:left"><div>תאריך: <strong>${fmtDate(new Date())}</strong></div></div></div><table><thead><tr><th>תאריך</th><th>סוג</th><th>תיאור</th><th>כמות</th><th>מחיר</th><th>סכום</th><th>הערה</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div class="summary-row"><span>סה״כ חובות</span><span class="debt-color">${debtsTotal.toLocaleString("he-IL")} ₪</span></div><div class="summary-row"><span>סה״כ תשלומים</span><span class="pay-color">${paymentsTotal.toLocaleString("he-IL")} ₪</span></div><div class="summary-row"><span>סה״כ החזרות</span><span class="pay-color">${returnsTotal.toLocaleString("he-IL")} ₪</span></div><div class="summary-row total"><span>יתרת חוב</span><span class="bal-color">${Number(balance || 0).toLocaleString("he-IL")} ₪</span></div></div>${settings?.footerText ? `<div class="footer">${settings.footerText}</div>` : ""}<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    w.document.close();
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const customerName = data?.account?.customer?.fullName || "לקוח";
    const customerPhone = data?.account?.customer?.phone || "";
    const { balance } = data;
    const message = `שלום ${customerName},\n\nלהלן כרטיס החשבון שלך נכון לתאריך ${new Date().toLocaleDateString("he-IL")}:\n\n💰 יתרת חוב: ${Number(balance || 0).toLocaleString("he-IL")} ₪\n\nלפרטים נוספים צור קשר.${settings?.storeName ? `\n\n${settings.storeName}` : ""}${settings?.storePhone ? `\n📞 ${settings.storePhone}` : ""}`;
    const encoded = encodeURIComponent(message);
    if (customerPhone) {
      const clean = customerPhone.replace(/\D/g, "");
      const intl = clean.startsWith("0") ? "972" + clean.slice(1) : clean;
      window.open(`https://wa.me/${intl}?text=${encoded}`, "_blank");
    } else { window.open(`https://web.whatsapp.com/`, "_blank"); navigator.clipboard?.writeText(message); }
  };

  const handlePrintArchive = async (item) => {
    const customerName = data?.account?.customer?.fullName || "לקוח";
    const customerPhone = data?.account?.customer?.phone || "";
    let transactions = item.transactions;
    if (!transactions) {
      try { const res = await api.get(`/accounts/archived/${item.account._id}`); transactions = res.data.transactions; }
      catch { setError("שגיאה בטעינת פרטי הארכיון לצורך הדפסה"); return; }
    }
    const debtsTotal = transactions.filter(t => t.type === "debt").reduce((s, t) => s + Number(t.amount || 0), 0);
    const paymentsTotal = transactions.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
    const returnsTotal = transactions.filter(t => t.type === "return").reduce((s, t) => s + Number(t.amount || 0), 0);
    const rows = transactions.map(t => `<tr><td>${fmtDate(t.date)}</td><td>${getTypeInfo(t.type).label}</td><td>${t.description || "—"}</td><td>${t.type === "payment" ? "—" : t.quantity || "—"}</td><td>${t.type === "payment" ? "—" : t.unitPrice || "—"}</td><td>${Number(t.amount || 0).toLocaleString("he-IL")} ₪</td><td class="note-cell">${t.note ? `📝 ${t.note}` : "—"}</td></tr>`).join("");
    const logoBanner = settings?.logoBase64 ? `<div class="logo-banner"><img src="${settings.logoBase64}" style="max-height:90px;max-width:100%;object-fit:contain"/></div>` : `<div class="logo-banner logo-text">${settings?.storeName || ""}</div>`;
    const storeInfo = [settings?.storePhone ? `טלפון: ${settings.storePhone}` : "", settings?.storeAddress || ""].filter(Boolean).join(" · ");
    const w = window.open("", "_blank", "width=1000,height=800");
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>ארכיון — ${customerName}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;direction:rtl;color:#111;background:#fff}.logo-banner{width:100%;background:#f8f8f8;border-bottom:2px solid #eee;display:flex;align-items:center;justify-content:center;padding:18px 32px;min-height:80px}.logo-text{font-size:26px;font-weight:800;color:#1a1a1a}.store-info{text-align:center;font-size:12px;color:#888;padding:7px 32px 10px;border-bottom:1px solid #f0f0f0}.details{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 32px;border-bottom:1px solid #eee;font-size:12px;color:#555;line-height:1.9}.details strong{color:#111;font-size:13px}.details-right{text-align:right}.details-left{text-align:left;color:#666}.archive-badge{display:inline-block;background:#EEEDFE;color:#3C3489;border:1px solid #AFA9EC;border-radius:20px;padding:2px 12px;font-size:11px;font-weight:700;margin-bottom:6px}.content{padding:0 32px 32px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:9px 11px;text-align:right;font-size:13px}th{background:#f5f5f5;font-weight:700;color:#444}.note-cell{font-size:11px;color:#777;max-width:160px;word-break:break-word}tr:nth-child(even){background:#fafafa}.summary{margin-top:20px;border:1px solid #eee;border-radius:8px;overflow:hidden}.summary-row{display:flex;justify-content:space-between;padding:9px 16px;font-size:13px;border-bottom:1px solid #f0f0f0}.summary-row:last-child{border-bottom:none}.summary-row.total{background:#f5f5f5;font-size:16px;font-weight:800}.debt-color{color:#A32D2D}.pay-color{color:#0F6E56}.bal-color{color:#534AB7}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center}</style></head><body>${logoBanner}${storeInfo ? `<div class="store-info">${storeInfo}</div>` : ""}<div class="details"><div class="details-right"><div class="archive-badge">📦 חשבון מאורכב</div><div>לקוח: <strong>${customerName}</strong></div>${customerPhone ? `<div>טלפון: <strong>${customerPhone}</strong></div>` : ""}${data?.account?.customer?.idNumber ? `<div>ת.ז.: <strong>${data.account.customer.idNumber}</strong></div>` : ""}</div><div class="details-left"><div>תאריך הדפסה: <strong>${fmtDate(new Date())}</strong></div><div>פתיחה: <strong>${fmtDate(item.account.openedAt)}</strong></div><div>ארכוב: <strong>${fmtDate(item.account.archivedAt)}</strong></div></div></div><div class="content"><table><thead><tr><th>תאריך</th><th>סוג</th><th>תיאור</th><th>כמות</th><th>מחיר</th><th>סכום</th><th>הערה</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div class="summary-row"><span>סה״כ חובות</span><span class="debt-color">${debtsTotal.toLocaleString("he-IL")} ₪</span></div><div class="summary-row"><span>סה״כ תשלומים</span><span class="pay-color">${paymentsTotal.toLocaleString("he-IL")} ₪</span></div><div class="summary-row"><span>סה״כ החזרות</span><span class="pay-color">${returnsTotal.toLocaleString("he-IL")} ₪</span></div><div class="summary-row total"><span>מאזן סופי</span><span class="bal-color">${Number(item.finalBalance || 0).toLocaleString("he-IL")} ₪</span></div></div>${settings?.footerText ? `<div class="footer">${settings.footerText}</div>` : ""}</div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F5F6FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#aaa", fontSize: 14 }}>טוען...</div>
    </div>
  );

  const { transactions = [], balance = 0 } = data || {};
  const debtsTotal = transactions.filter(t => t.type === "debt").reduce((s, t) => s + Number(t.amount || 0), 0);
  const paymentsTotal = transactions.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
  const customer = data?.account?.customer;

  return (
    <div style={{ direction: "rtl", minHeight: "100vh", background: "#F5F6FA", padding: "16px", boxSizing: "border-box", fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        .tx-row:hover { background:#fafafe !important; }
        .tx-row:hover .row-actions { opacity:1 !important; }
        input:focus, select:focus { border-color:#AFA9EC !important; box-shadow:0 0 0 3px #EEEDFE !important; }
        .tab-btn { border:none;background:none;cursor:pointer;padding:10px 14px;font-size:13px;font-weight:600;color:#aaa;border-bottom:2px solid transparent;transition:all 0.15s;font-family:inherit;white-space:nowrap; }
        .tab-btn.active { color:#534AB7;border-bottom-color:#534AB7; }
        .icon-btn { border:none;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;font-family:inherit; }
        .note-wrap:hover .note-tooltip { opacity:1 !important; }
        .tx-table-wrap { overflow-x:auto;-webkit-overflow-scrolling:touch; }
        .arch-table-wrap { overflow-x:auto;-webkit-overflow-scrolling:touch; }
        @media (max-width:700px) {
          .acc-header{padding:14px 16px !important}
          .acc-avatar{width:40px !important;height:40px !important;font-size:13px !important}
          .acc-name{font-size:18px !important}
          .stat-cards{flex-direction:row !important;flex-wrap:wrap !important}
          .balance-card{padding:16px 18px !important}
          .balance-amount{font-size:24px !important}
          .form-wrap{padding:14px !important}
          .tx-table{display:none !important}
          .tx-cards{display:flex !important}
          .header-actions{flex-direction:column !important;align-items:flex-start !important;gap:8px !important}
        }
        @media (min-width:701px) {
          .tx-table{display:table !important}
          .tx-cards{display:none !important}
        }
      `}</style>

      <EditCustomerModal open={editCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={customer} onSaved={fetchData} knownLastNames={knownLastNames} />
      <DeleteCustomerModal open={deleteCustomerOpen} onClose={() => setDeleteCustomerOpen(false)} customer={customer} stats={deleteStats} onDeleted={() => navigate("/customers")} />
      <CalcModal open={calcOpen} onClose={() => setCalcOpen(false)} items={items} onAdd={handleCalcAdd} />

      {/* PIN Modal */}
      {pinOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => { setPinOpen(false); setPinCode(""); setPinError(""); }}>
          <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 300, padding: "28px 24px", direction: "rtl", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: pinShake ? "shake 0.4s ease" : "fadeIn 0.2s ease" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EEEDFE", color: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 22 }}>🔒</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>אימות נדרש</div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 18 }}>הזן את קוד הנעילה לצפייה ברווח</div>
            <input autoFocus type="password" value={pinCode}
              onChange={e => { setPinCode(e.target.value); setPinError(""); }}
              onKeyDown={e => e.key === "Enter" && handlePinSubmit()}
              placeholder="• • • •"
              style={{ width: "100%", boxSizing: "border-box", border: `0.5px solid ${pinError ? "#F09595" : "#ddd"}`, borderRadius: 10, padding: "11px 14px", fontSize: 20, letterSpacing: "0.3em", color: "#1a1a1a", outline: "none", textAlign: "center", fontFamily: "inherit", marginBottom: pinError ? 8 : 16 }}
            />
            {pinError && <div style={{ background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>{pinError}</div>}
            <button onClick={handlePinSubmit} disabled={pinLoading || !pinCode.trim()}
              style={{ width: "100%", background: "#534AB7", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, cursor: pinLoading || !pinCode.trim() ? "not-allowed" : "pointer", opacity: !pinCode.trim() ? 0.5 : 1 }}>
              {pinLoading ? "בודק..." : "אישור"}
            </button>
          </div>
        </div>
      )}

      {/* Archive Prompt */}
      {showArchivePrompt && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 420, padding: "28px 24px", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", animation: "fadeIn 0.25s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.teal.bg, color: C.teal.icon, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: `1.5px solid ${C.teal.border}` }}>{Icon.check}</div>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>החשבון מאוזן! ✓</div>
              <div style={{ fontSize: 14, color: "#666", lineHeight: 1.7 }}>יתרת החשבון הגיעה לאפס.<br />האם ברצונך להעביר את החשבון לארכיון?</div>
            </div>
            <div style={{ background: C.amber.bg, border: `0.5px solid ${C.amber.border}`, borderRadius: 10, padding: "10px 14px", margin: "18px 0", fontSize: 12, color: C.amber.text, lineHeight: 1.6 }}>
              💡 העברה לארכיון תשמור את כל ההיסטוריה ותאפשר פתיחת חשבון חדש ללקוח.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowArchivePrompt(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "0.5px solid #ddd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#666", cursor: "pointer" }}>לא, המשך</button>
              <button onClick={handleArchive} disabled={archiving} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: C.teal.icon, color: "#fff", fontSize: 13, fontWeight: 700, cursor: archiving ? "not-allowed" : "pointer", opacity: archiving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {Icon.archive} {archiving ? "מעביר..." : "כן, העבר לארכיון"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Details Modal */}
      {archiveOpen && selectedArchive && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setArchiveOpen(false)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 800, maxHeight: "85vh", overflow: "auto", padding: "20px 16px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>פרטי חשבון בארכיון</div>
              <button className="icon-btn" onClick={() => setArchiveOpen(false)} style={{ width: 28, height: 28, background: "#f5f5f5", color: "#888" }}>{Icon.close}</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.red.text, marginBottom: 14 }}>יתרה סופית: {fmtCurrency(selectedArchive.finalBalance || selectedArchive.balance || 0)}</div>
            {archiveDetailLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#aaa", fontSize: 13 }}>טוען...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 500 }}>
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid #f0f0f0" }}>
                      {["תאריך", "סוג", "תיאור", "כמות", "מחיר", "סכום"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#888", fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedArchive.transactions ? (
                      <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#bbb", fontSize: 13 }}>טוען...</td></tr>
                    ) : selectedArchive.transactions.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#ccc", fontSize: 13 }}>אין עסקאות</td></tr>
                    ) : selectedArchive.transactions.map((t, i) => {
                      const { color } = getTypeInfo(t.type);
                      return (
                        <tr key={t._id || i} style={{ borderBottom: "0.5px solid #f9f9f9" }}>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#888" }}>{fmtDate(t.date)}</td>
                          <td style={{ padding: "10px 12px" }}><TypeBadge type={t.type} /></td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#1a1a1a" }}>{t.description || "—"}</td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#888" }}>{t.type === "payment" ? "—" : t.quantity || "—"}</td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#888" }}>{t.type === "payment" ? "—" : t.unitPrice || "—"}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: color.text }}>{fmtCurrency(t.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>

        {/* Header */}
        <div className="acc-header" style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="icon-btn" onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: "#f5f5f5", color: "#666", flexShrink: 0 }}>{Icon.back}</button>
            {(() => {
              const name = customer?.fullName || customer?.name || "לקוח";
              const words = name.trim().split(/\s+/);
              const inits = words.length === 1 ? words[0].slice(0, 2) : `${words[0][0]}${words[words.length - 1][0]}`;
              const colors = [["#EEEDFE", "#3C3489"], ["#E1F5EE", "#085041"], ["#E6F1FB", "#0C447C"], ["#FBEAF0", "#72243E"], ["#FAEEDA", "#633806"]];
              const [avatarBg, avatarText] = colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="acc-avatar" style={{ width: 48, height: 48, borderRadius: "50%", background: avatarBg, color: avatarText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0, outline: "3px solid #FED7AA", outlineOffset: "2px" }}>{inits}</div>
                  <div>
                    <div style={{ fontSize: 10, color: "#534AB7", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 2 }}>חשבון לקוח</div>
                    <div className="acc-name" style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.1 }}>{name}</div>
                    {customer?.phone && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, color: "#aaa", fontSize: 12 }}><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5L6 7a7.9 7.9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg><span>{customer.phone}</span></div>}
                    {customer?.idNumber && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, color: "#bbb", fontSize: 11 }}><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M8 7h4M8 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg><span style={{ fontFamily: "monospace" }}>{customer.idNumber}</span></div>}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Printer size={22} strokeWidth={1.6} onClick={handlePrint} title="הדפס" style={{ cursor: "pointer", color: "#888", transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = "#1a1a1a"} onMouseLeave={e => e.currentTarget.style.color = "#888"} />
            <FileText size={22} strokeWidth={1.6} onClick={handleExportPDF} title="הורד PDF" style={{ cursor: "pointer", color: "#888", transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = "#C2410C"} onMouseLeave={e => e.currentTarget.style.color = "#888"} />
            <FaWhatsapp size={22} onClick={handleWhatsApp} title="שתף ב-WhatsApp" style={{ cursor: "pointer", color: "#888", transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = "#25D366"} onMouseLeave={e => e.currentTarget.style.color = "#888"} />
            <span onClick={() => setPinOpen(true)} title="רווח" style={{ fontSize: 20, cursor: "pointer", opacity: 0.6, transition: "opacity 0.15s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>💰</span>
            <Pencil size={20} strokeWidth={1.6} onClick={() => setEditCustomerOpen(true)} title="ערוך פרטים" style={{ cursor: "pointer", color: "#888", transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = "#534AB7"} onMouseLeave={e => e.currentTarget.style.color = "#888"} />
            <Trash2 size={20} strokeWidth={1.6} onClick={openDeleteModal} title="מחק לקוח" style={{ cursor: "pointer", color: "#888", transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = "#DC2626"} onMouseLeave={e => e.currentTarget.style.color = "#888"} />
          </div>
        </div>

        {error && <div style={{ background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        {scanToast && (
          <div style={{ background: scanToast.found ? C.teal.bg : C.red.bg, border: `0.5px solid ${scanToast.found ? C.teal.border : C.red.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.2s ease" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: scanToast.found ? C.teal.icon : C.red.icon, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{Icon.barcode}</div>
            <div style={{ flex: 1 }}>
              {scanToast.found
                ? <><div style={{ fontSize: 13, fontWeight: 700, color: C.teal.text }}>✓ {scanToast.name}</div><div style={{ fontSize: 11, color: C.teal.text, opacity: 0.8 }}>{fmtCurrency(scanToast.price)} · הפריט נוסף אוטומטית</div></>
                : <><div style={{ fontSize: 13, fontWeight: 700, color: C.red.text }}>ברקוד לא נמצא</div><div style={{ fontSize: 11, color: C.red.text, opacity: 0.8, fontFamily: "monospace" }}>{scanToast.code}</div></>
              }
            </div>
            <button onClick={() => setScanToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: scanToast.found ? C.teal.text : C.red.text, opacity: 0.6, padding: 4 }}>{Icon.close}</button>
          </div>
        )}

        {scanMode && (
          <div style={{ background: C.purple.bg, border: `0.5px solid ${C.purple.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.2s ease" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#534AB7", animation: "pulse 1s infinite", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.purple.text }}>ממתין לסריקה — כוון את הסורק לברקוד</div>
            <button onClick={() => setScanMode(false)} style={{ background: C.purple.icon, color: "#fff", border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>ביטול</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "0.5px solid #f0f0f0", padding: "0 16px", overflowX: "auto" }}>
            <button className={`tab-btn${tab === 0 ? " active" : ""}`} onClick={() => setTab(0)}>חשבון נוכחי</button>
            <button className={`tab-btn${tab === 1 ? " active" : ""}`} onClick={() => setTab(1)}>ארכיון {archivedAccounts.length > 0 && `(${archivedAccounts.length})`}</button>
          </div>

          {tab === 0 && (
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Balance */}
              {(() => {
                const isDebt = Number(balance) > 0;
                const card = isDebt
                  ? { bg: "#FCEBEB", border: "#F09595", numColor: "#A32D2D", badgeBg: "#E24B4A", iconBg: "#E24B4A", label: "חוב פתוח" }
                  : { bg: "#E1F5EE", border: "#5DCAA5", numColor: "#0F6E56", badgeBg: "#1D9E75", iconBg: "#1D9E75", label: "מאוזן" };
                return (
                  <div className="balance-card" style={{ background: card.bg, border: `1.5px solid ${card.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: card.iconBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{Icon.wallet}</div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: card.numColor, textTransform: "uppercase", marginBottom: 2 }}>יתרת חוב</div>
                        <div className="balance-amount" style={{ fontSize: 32, fontWeight: 600, color: card.numColor, lineHeight: 1 }}>{fmtCurrency(balance)}</div>
                      </div>
                    </div>
                    <div style={{ background: card.badgeBg, color: "#fff", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{card.label}</div>
                  </div>
                );
              })()}

              {/* Stat cards */}
              <div className="stat-cards" style={{ display: "flex", gap: 10 }}>
                <StatCard label="סה״כ חובות" value={fmtCurrency(debtsTotal)} icon={Icon.up} color={C.red} />
                <StatCard label="סה״כ תשלומים" value={fmtCurrency(paymentsTotal)} icon={Icon.down} color={C.teal} />
                <StatCard label="עסקאות" value={transactions.length} icon={Icon.receipt} color={C.purple} />
              </div>

              {/* Profit Modal */}
              {profitOpen && (() => {
                let totalProfit = 0; let counted = 0;
                transactions.forEach(t => {
                  if (t.type !== "debt") return;
                  const linkedItem = t.item ? items.find(it => String(it._id) === String(t.item?._id || t.item)) : items.find(it => it.name === t.description);
                  if (linkedItem?.costPrice) { const qty = Number(t.quantity || 1); totalProfit += Number(t.amount || 0) - linkedItem.costPrice * qty; counted++; }
                });
                const isPositive = totalProfit >= 0;
                return (
                  <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setProfitOpen(false)}>
                    <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 320, padding: "28px 24px", direction: "rtl", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: isPositive ? C.teal.bg : C.red.bg, color: isPositive ? C.teal.icon : C.red.icon, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>{isPositive ? "↑" : "↓"}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 6, letterSpacing: "0.05em" }}>רווח מצטבר — {customer?.fullName || "לקוח"}</div>
                      <div style={{ fontSize: 36, fontWeight: 800, color: isPositive ? C.teal.text : C.red.text, lineHeight: 1.1, marginBottom: 8 }}>{isPositive ? "+" : ""}{fmtCurrency(totalProfit)}</div>
                      {counted === 0 ? <div style={{ fontSize: 12, color: "#bbb", marginTop: 8 }}>אין פריטים עם מחיר עלות מוגדר</div> : <div style={{ fontSize: 12, color: "#bbb" }}>מחושב מתוך {counted} עסקאות</div>}
                      <button onClick={() => setProfitOpen(false)} style={{ marginTop: 20, background: "#f5f5f5", border: "none", borderRadius: 9, padding: "9px 28px", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer" }}>סגור</button>
                    </div>
                  </div>
                );
              })()}

              {/* ── Batch Add Form ── */}
              <div className="form-wrap" style={{ background: "#FAFBFF", border: "0.5px solid #E8E8F0", borderRadius: 12, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 3, height: 16, background: "#534AB7", borderRadius: 99 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: "0.05em", textTransform: "uppercase" }}>הוסף עסקאות</span>
                  </div>
                  {/* Action buttons: Calc + Scan */}
                  {batchType !== "payment" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setCalcOpen(true)} title="מחשבון מינונים"
                        style={{ display: "flex", alignItems: "center", gap: 5, background: "#EEEDFE", color: "#534AB7", border: "0.5px solid #AFA9EC", borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>
                        {Icon.flask} מינונים
                      </button>
                      <button onClick={() => setScanMode(s => !s)} title={scanMode ? "ביטול סריקה" : "סרוק ברקוד"}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: scanMode ? C.purple.bg : "#f5f5f5", color: scanMode ? C.purple.text : "#666", border: `0.5px solid ${scanMode ? C.purple.border : "#ddd"}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", touchAction: "manipulation" }}>
                        {Icon.scan} {scanMode ? "מבטל..." : "סרוק"}
                      </button>
                    </div>
                  )}
                </div>

                {/* שורה עליונה */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 100px" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>סוג</label>
                    <select value={batchType} onChange={e => { setBatchType(e.target.value); setScanMode(false); }} style={{ ...selectStyle }}>
                      <option value="debt">חוב</option>
                      <option value="payment">תשלום</option>
                      <option value="return">החזרה</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 130px" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>תאריך</label>
                    <input type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)} style={{ ...inputStyle }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "2 1 160px" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>הערה לכל השורות (אופציונלי)</label>
                    <input value={batchRows[0]?.sharedNote ?? ""} onChange={e => setBatchRows(prev => prev.map(r => ({ ...r, sharedNote: e.target.value })))} placeholder="הערה..." style={{ ...inputStyle, fontSize: 12, color: "#777" }} />
                  </div>
                </div>

                {/* שורות */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  <datalist id="items-list-batch">{items.map(it => <option key={it._id} value={it.name} />)}</datalist>
                  {batchRows.map((row, i) => (
                    <div key={row.id} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <input list="items-list-batch" value={row.description}
                          onChange={e => {
                            const val = e.target.value;
                            const match = items.find(it => it.name === val);
                            if (match) updateRow(row.id, { description: val, unitPrice: String(match.price || ""), item: match._id });
                            else updateRow(row.id, { description: val, item: null });
                          }}
                          placeholder={batchType === "payment" ? "אמצעי תשלום..." : "פריט / תיאור..."}
                          style={{ ...inputStyle, flex: "3 1 160px", minWidth: 120 }}
                        />
                        {batchType !== "payment" && <input type="number" value={row.quantity} onChange={e => updateRow(row.id, { quantity: e.target.value })} placeholder="כמות" style={{ ...inputStyle, flex: "1 1 60px", minWidth: 55, textAlign: "center" }} />}
                        {batchType !== "payment" && <input type="number" value={row.unitPrice} onChange={e => updateRow(row.id, { unitPrice: e.target.value })} placeholder="מחיר" style={{ ...inputStyle, flex: "1 1 70px", minWidth: 65, textAlign: "center" }} />}
                        <input type="number" value={row.amount} onChange={e => updateRow(row.id, { amount: e.target.value })} placeholder="סכום ₪" style={{ ...inputStyle, flex: "1 1 80px", minWidth: 75, fontWeight: 700, textAlign: "center" }} />
                        {i === batchRows.length - 1 && (
                          <button onClick={addRow} title="הוסף שורה" style={{ width: 34, height: 36, borderRadius: 8, border: "0.5px solid #ddd", background: "#f5f5f5", color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "manipulation" }}>
                            {Icon.plus}
                          </button>
                        )}
                        {batchRows.length > 1 && (
                          <button onClick={() => removeRow(row.id)} style={{ width: 34, height: 36, borderRadius: 8, border: "none", background: C.red.bg, color: C.red.icon, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "manipulation" }}>
                            {Icon.trash}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  {batchRows.length > 1 && batchTotal > 0 && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#aaa", fontWeight: 500 }}>סה״כ</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{fmtCurrency(batchTotal)}</div>
                    </div>
                  )}
                  <button onClick={handleAddAll} disabled={adding}
                    style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: adding ? "not-allowed" : "pointer", opacity: adding ? 0.7 : 1, width: "100%", maxWidth: 260, touchAction: "manipulation" }}>
                    {adding ? "שומר..." : "שמור"}
                  </button>
                </div>
              </div>

              {/* Transactions Desktop */}
              <div className="tx-table-wrap">
                <table className="tx-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 650, border: "0.5px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
                  <thead>
                    <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #f0f0f0" }}>
                      {["תאריך", "סוג", "תיאור / פריט", "כמות", "מחיר", "סכום", "הערה", "פעולות"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 && <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: 13 }}>אין עסקאות עדיין</td></tr>}
                    {transactions.map((t, i) => {
                      const isEditing = editingId === t._id;
                      const { color, prefix } = getTypeInfo(t.type);
                      return (
                        <tr key={t._id} className="tx-row" style={{ borderBottom: i < transactions.length - 1 ? "0.5px solid #f5f5f5" : "none", background: "#fff", transition: "background 0.12s" }}>
                          <td style={{ padding: "10px 12px", color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>
                            {isEditing ? <input type="date" value={editForm.date || ""} onChange={e => handleEditChange("date", e.target.value)} style={{ ...inputStyle, width: 130 }} /> : fmtDate(t.date)}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {isEditing ? <select value={editForm.type || ""} onChange={e => handleEditChange("type", e.target.value)} style={{ ...selectStyle, width: 100 }}><option value="debt">חוב</option><option value="payment">תשלום</option><option value="return">החזרה</option></select> : <TypeBadge type={t.type} />}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#1a1a1a" }}>
                            {isEditing ? <input value={editForm.description || ""} onChange={e => handleEditChange("description", e.target.value)} style={{ ...inputStyle, width: 150 }} /> : t.description || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#888", fontSize: 12 }}>
                            {isEditing ? (editForm.type !== "payment" ? <input type="number" value={editForm.quantity || ""} onChange={e => handleEditChange("quantity", e.target.value)} style={{ ...inputStyle, width: 65 }} /> : "—") : (t.type === "payment" ? "—" : t.quantity || "—")}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#888", fontSize: 12 }}>
                            {isEditing ? (editForm.type !== "payment" ? <input type="number" value={editForm.unitPrice || ""} onChange={e => handleEditChange("unitPrice", e.target.value)} style={{ ...inputStyle, width: 75 }} /> : "—") : (t.type === "payment" ? "—" : t.unitPrice ? `₪${t.unitPrice}` : "—")}
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: color.text, whiteSpace: "nowrap" }}>
                            {isEditing ? <input type="number" value={editForm.amount || ""} onChange={e => handleEditChange("amount", e.target.value)} style={{ ...inputStyle, width: 85, fontWeight: 700 }} /> : `${prefix}${fmtCurrency(t.amount)}`}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {isEditing ? (
                              <input value={editForm.note || ""} onChange={e => handleEditChange("note", e.target.value)} placeholder="הערה..." style={{ ...inputStyle, width: 130, fontSize: 12 }} />
                            ) : t.note ? (
                              <div className="note-wrap" style={{ position: "relative", display: "inline-block" }}>
                                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#FAEEDA", color: "#854F0B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>{Icon.note}</div>
                                <div className="note-tooltip" style={{ position: "absolute", bottom: "calc(100% + 10px)", right: 0, background: "#fff", border: "0.5px solid #FAC775", borderRadius: 10, padding: "10px 14px", width: 200, whiteSpace: "normal", lineHeight: 1.6, zIndex: 100, pointerEvents: "none", opacity: 0, transition: "opacity 0.15s", boxShadow: "0 4px 16px rgba(186,117,23,0.12)" }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#854F0B", textTransform: "uppercase", marginBottom: 5 }}>הערה</div>
                                  <div style={{ fontSize: 12, color: "#444" }}>{t.note}</div>
                                </div>
                              </div>
                            ) : <span style={{ color: "#ddd", fontSize: 11 }}>—</span>}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", gap: 5 }}>
                                <button className="icon-btn" onClick={() => saveEdit(t._id)} style={{ width: 28, height: 28, background: C.teal.bg, color: C.teal.icon }}>{Icon.save}</button>
                                <button className="icon-btn" onClick={cancelEdit} style={{ width: 28, height: 28, background: "#f5f5f5", color: "#888" }}>{Icon.close}</button>
                              </div>
                            ) : (
                              <div className="row-actions" style={{ display: "flex", gap: 5, opacity: 0, transition: "opacity 0.15s" }}>
                                <button className="icon-btn" onClick={() => startEdit(t)} style={{ width: 28, height: 28, background: C.blue.bg, color: C.blue.icon }}>{Icon.edit}</button>
                                <button className="icon-btn" onClick={() => handleDelete(t._id)} style={{ width: 28, height: 28, background: C.red.bg, color: C.red.icon }}>{Icon.trash}</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Transactions Mobile */}
              <div className="tx-cards" style={{ flexDirection: "column", gap: 8 }}>
                {transactions.length === 0
                  ? <div style={{ padding: "32px 0", textAlign: "center", color: "#ccc", fontSize: 13 }}>אין עסקאות עדיין</div>
                  : transactions.map(t => <TxCard key={t._id} t={t} onEdit={startEdit} onDelete={handleDelete} />)
                }
              </div>

              {/* Edit modal mobile */}
              {editingId && isMobile && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxHeight: "85vh", overflow: "auto", padding: "20px 16px 32px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>עריכת עסקה</div>
                      <button className="icon-btn" onClick={cancelEdit} style={{ width: 28, height: 28, background: "#f5f5f5", color: "#888" }}>{Icon.close}</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <Field label="תאריך"><input type="date" value={editForm.date || ""} onChange={e => handleEditChange("date", e.target.value)} style={inputStyle} /></Field>
                      <Field label="סוג"><select value={editForm.type || ""} onChange={e => handleEditChange("type", e.target.value)} style={selectStyle}><option value="debt">חוב</option><option value="payment">תשלום</option><option value="return">החזרה</option></select></Field>
                      <Field label="תיאור"><input value={editForm.description || ""} onChange={e => handleEditChange("description", e.target.value)} style={inputStyle} /></Field>
                      {editForm.type !== "payment" && <Field label="כמות"><input type="number" value={editForm.quantity || ""} onChange={e => handleEditChange("quantity", e.target.value)} style={inputStyle} /></Field>}
                      {editForm.type !== "payment" && <Field label="מחיר יחידה"><input type="number" value={editForm.unitPrice || ""} onChange={e => handleEditChange("unitPrice", e.target.value)} style={inputStyle} /></Field>}
                      <Field label="סכום"><input type="number" value={editForm.amount || ""} onChange={e => handleEditChange("amount", e.target.value)} style={{ ...inputStyle, fontWeight: 700 }} /></Field>
                      <Field label="הערה"><input value={editForm.note || ""} onChange={e => handleEditChange("note", e.target.value)} placeholder="הערה..." style={inputStyle} /></Field>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                      <button onClick={() => saveEdit(editingId)} style={{ flex: 1, background: C.teal.icon, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>שמור</button>
                      <button onClick={cancelEdit} style={{ flex: 1, background: "#f5f5f5", color: "#555", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>ביטול</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 1 && (
            <div style={{ padding: "16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>ארכיון חשבונות</div>
              {archivedAccounts.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: "#ccc" }}>
                  <div style={{ marginBottom: 8 }}>{Icon.archive}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#ccc" }}>אין חשבונות בארכיון</div>
                </div>
              ) : (
                <div className="arch-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560, border: "0.5px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
                    <thead>
                      <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #f0f0f0" }}>
                        {["פתיחה", "ארכוב", "חובות", "תשלומים", "מאזן", "שורות", ""].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {archivedAccounts.map((item, i) => (
                        <tr key={item.account._id} className="tx-row" style={{ borderBottom: i < archivedAccounts.length - 1 ? "0.5px solid #f5f5f5" : "none", background: "#fff" }}>
                          <td style={{ padding: "10px 12px", color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(item.account.openedAt)}</td>
                          <td style={{ padding: "10px 12px", color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(item.account.archivedAt)}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: C.red.text, whiteSpace: "nowrap" }}>{fmtCurrency(item.debtsTotal)}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: C.teal.text, whiteSpace: "nowrap" }}>{fmtCurrency(item.paymentsTotal)}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>{fmtCurrency(item.finalBalance)}</td>
                          <td style={{ padding: "10px 12px", color: "#888" }}>{item.transactionsCount}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={async () => {
                                try {
                                  setArchiveDetailLoading(item.account._id); setSelectedArchive(item); setArchiveOpen(true);
                                  const res = await api.get(`/accounts/archived/${item.account._id}`);
                                  setSelectedArchive({ ...item, transactions: res.data.transactions });
                                } catch (err) { setError(err.response?.data?.message || "שגיאה בטעינת הארכיון"); setArchiveOpen(false); }
                                finally { setArchiveDetailLoading(false); }
                              }} style={{ background: C.purple.bg, color: C.purple.text, border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>הצג</button>
                              <button onClick={() => handlePrintArchive(item)} style={{ display: "flex", alignItems: "center", gap: 4, background: "#f5f5f5", color: "#555", border: "0.5px solid #ddd", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                                {Icon.print} הדפס
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
