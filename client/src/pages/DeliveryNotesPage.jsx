import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

const C = {
  purple: { bg: "#EEEDFE", border: "#AFA9EC", icon: "#534AB7", text: "#3C3489" },
  red:    { bg: "#FCEBEB", border: "#F09595", icon: "#A32D2D", text: "#791F1F" },
  amber:  { bg: "#FAEEDA", border: "#FAC775", icon: "#854F0B", text: "#633806" },
  teal:   { bg: "#E1F5EE", border: "#5DCAA5", icon: "#0F6E56", text: "#085041" },
  blue:   { bg: "#E6F1FB", border: "#85B7EB", icon: "#185FA5", text: "#0C447C" },
  gray:   { bg: "#F1EFE8", border: "#B4B2A9", icon: "#5F5E5A", text: "#444441" },
  orange: { bg: "#FFF3E0", border: "#FFB74D", icon: "#E65100", text: "#BF360C" },
};

function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("he-IL"); }
function fmtCurrency(n) { return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Number(n || 0)); }
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

const Icon = {
  plus:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  trash:   <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2h4v2M5 4l1 10h4l1-10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  print:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="4" y="1" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="6" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 13h6M5 10h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  convert: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  account: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  save:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 14V3l2-1h6l2 2v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><rect x="5" y="9" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  truck:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M11 7h2.5L15 10v3h-4V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="4" cy="13.5" r="1.2" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="13.5" r="1.2" stroke="currentColor" strokeWidth="1.2"/></svg>,
  search:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  close:   <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  phone:   <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5L6 7a7.9 7.9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  tag:     <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 2h5l7 7-5 5-7-7V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="5" cy="5" r="1" fill="currentColor"/></svg>,
  warning: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  sync:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M12 4l.5 2.5L15 6M1 10l2.5.5L4 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  edit:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
};

const inputStyle = {
  border: "0.5px solid #ddd", borderRadius: 8, padding: "8px 10px",
  fontSize: 13, color: "#1a1a1a", outline: "none", background: "#fff",
  width: "100%", boxSizing: "border-box",
  fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
};

function Field({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>{label}</label>
      {children}
    </div>
  );
}

function SectionBar({ title, color = "#534AB7" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 16, background: color, borderRadius: 99 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</span>
    </div>
  );
}

// ── Modal تعديل — Bottom Sheet على الموبايل ──
function EditNoteModal({ note, onClose, onSaved }) {
  const [rows, setRows] = useState(note.items.map(item => ({ ...item, id: crypto.randomUUID() })));
  const [noteText, setNoteText] = useState(note.note || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateRow = (id, patch) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const next = { ...row, ...patch };
      const q = Number(next.quantity || 0), p = Number(next.unitPrice || 0);
      if (q && p) next.amount = q * p;
      return next;
    }));
  };

  const total = useMemo(() => rows.reduce((s, r) => s + Number(r.amount || 0), 0), [rows]);

  const handleSave = async () => {
    try {
      setLoading(true); setError("");
      await api.put(`/delivery-notes/${note._id}`, {
        items: rows.map(r => ({ date: r.date, description: r.description, quantity: Number(r.quantity || 0), unitPrice: Number(r.unitPrice || 0), amount: Number(r.amount || 0), note: r.note || "", item: r.item || null })),
        note: noteText, date: note.date,
      });
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בשמירה");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.32)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 860, maxHeight: "92vh", overflow: "auto", padding: "20px 16px 32px", direction: "rtl" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>עריכת תעודת משלוח</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{note.noteNumber}</div>
          </div>
          <button onClick={onClose} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>{Icon.close}</button>
        </div>

        {note.status === "converted" && (
          <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 10, padding: "9px 12px", fontSize: 12, fontWeight: 600, color: C.orange.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {Icon.warning} שינויים לא יתעדכנו בחשבון אוטומטית
          </div>
        )}

        <div style={{ overflowX: "auto", marginBottom: 12, WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480, border: "0.5px solid #e8e8e8", borderRadius: 10 }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #f0f0f0" }}>
                {["תאריך", "פריט", "כמות", "מחיר", "סכום", ""].map(h => (
                  <th key={h} style={{ padding: "9px 9px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i < rows.length - 1 ? "0.5px solid #f5f5f5" : "none" }}>
                  <td style={{ padding: "6px 7px", width: 115 }}><input type="date" value={row.date ? new Date(row.date).toISOString().slice(0, 10) : ""} onChange={e => updateRow(row.id, { date: e.target.value })} style={{ ...inputStyle, fontSize: 12 }} /></td>
                  <td style={{ padding: "6px 7px", minWidth: 150 }}><input value={row.description} onChange={e => updateRow(row.id, { description: e.target.value })} placeholder="תיאור..." style={inputStyle} /></td>
                  <td style={{ padding: "6px 7px", width: 65 }}><input type="number" value={row.quantity || ""} onChange={e => updateRow(row.id, { quantity: e.target.value })} placeholder="0" style={{ ...inputStyle, textAlign: "center" }} /></td>
                  <td style={{ padding: "6px 7px", width: 80 }}><input type="number" value={row.unitPrice || ""} onChange={e => updateRow(row.id, { unitPrice: e.target.value })} placeholder="₪" style={{ ...inputStyle, textAlign: "center" }} /></td>
                  <td style={{ padding: "6px 7px", width: 90 }}><input type="number" value={row.amount || ""} onChange={e => updateRow(row.id, { amount: e.target.value })} placeholder="₪" style={{ ...inputStyle, fontWeight: 700, textAlign: "center" }} /></td>
                  <td style={{ padding: "6px 7px", width: 32 }}>
                    <button onClick={() => rows.length > 1 && setRows(p => p.filter(r => r.id !== row.id))} style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: C.red.bg, color: C.red.icon, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icon.trash}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <button onClick={() => setRows(p => [...p, { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), description: "", quantity: "", unitPrice: "", amount: "", item: null }])}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5f5f5", color: "#555", border: "0.5px solid #ddd", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {Icon.plus} הוסף שורה
          </button>
          <div><div style={{ fontSize: 11, color: "#aaa" }}>סה״כ</div><div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>{fmtCurrency(total)}</div></div>
        </div>

        <Field label="הערה" style={{ marginBottom: 14 }}>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
        </Field>

        {error && <div style={{ background: C.red.bg, color: C.red.text, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={loading} style={{ flex: 1, background: "#0F6E56", color: "#fff", border: "none", borderRadius: 9, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1, touchAction: "manipulation" }}>
            {loading ? "שומר..." : "שמור שינויים"}
          </button>
          <button onClick={onClose} style={{ flex: 1, background: "#f5f5f5", color: "#555", border: "none", borderRadius: 9, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ── الصفحة الرئيسية ──
export default function DeliveryNotesPage() {
  const navigate = useNavigate();
  const descRef = useRef();

  const [notes, setNotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [editingNote, setEditingNote] = useState(null);

  const [noteInfo, setNoteInfo] = useState({
    customer: null, customerName: "", customerPhone: "",
    date: new Date().toISOString().slice(0, 10), note: "",
  });

  const [rows, setRows] = useState([{
    id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10),
    description: "", quantity: "", unitPrice: "", amount: "", item: null,
  }]);

  useEffect(() => {
    Promise.all([api.get("/delivery-notes"), api.get("/customers"), api.get("/items"), api.get("/settings")])
      .then(([n, c, i, s]) => {
        setNotes(Array.isArray(n.data) ? n.data : []);
        setCustomers(Array.isArray(c.data) ? c.data : []);
        setItems(Array.isArray(i.data) ? i.data : []);
        setSettings(s.data);
      }).catch(err => setError(err.response?.data?.message || "שגיאה בטעינה"));
  }, []);

  const fetchNotes = async () => {
    const res = await api.get("/delivery-notes");
    setNotes(Array.isArray(res.data) ? res.data : []);
  };

  const total = useMemo(() => rows.reduce((s, r) => s + Number(r.amount || 0), 0), [rows]);

  const filteredCustomers = useMemo(() => {
    const q = custSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 6);
    return customers.filter(c => (c.fullName || "").toLowerCase().includes(q) || (c.phone || "").includes(q)).slice(0, 6);
  }, [customers, custSearch]);

  const selectCustomer = (c) => { setNoteInfo(p => ({ ...p, customer: c._id, customerName: c.fullName || "", customerPhone: c.phone || "" })); setCustSearch(c.fullName || ""); setShowDropdown(false); };
  const clearCustomer = () => { setNoteInfo(p => ({ ...p, customer: null, customerName: "", customerPhone: "" })); setCustSearch(""); };

  const updateRow = (id, patch) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const next = { ...row, ...patch };
      const q = Number(next.quantity || 0), p = Number(next.unitPrice || 0);
      if (q && p) next.amount = q * p;
      return next;
    }));
  };

  const addRow = () => setRows(prev => [...prev, { id: crypto.randomUUID(), date: noteInfo.date, description: "", quantity: "", unitPrice: "", amount: "", item: null }]);
  const removeRow = (id) => { if (rows.length > 1) setRows(p => p.filter(r => r.id !== id)); };

  const handleSave = async () => {
    if (!noteInfo.customer) { setError("יש לבחור לקוח קיים"); return; }
    const validRows = rows.filter(r => r.description && Number(r.quantity || 0) > 0);
    if (validRows.length === 0) { setError("יש להוסיף לפחות שורה אחת תקינה"); return; }
    try {
      setError("");
      await api.post("/delivery-notes", {
        customer: noteInfo.customer, customerName: noteInfo.customerName, customerPhone: noteInfo.customerPhone,
        date: noteInfo.date, note: noteInfo.note,
        items: validRows.map(r => ({ date: r.date, description: r.description, quantity: Number(r.quantity || 0), unitPrice: Number(r.unitPrice || 0), amount: Number(r.amount || 0), item: r.item || null })),
      });
      setNoteInfo({ customer: null, customerName: "", customerPhone: "", date: new Date().toISOString().slice(0, 10), note: "" });
      setCustSearch("");
      setRows([{ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), description: "", quantity: "", unitPrice: "", amount: "", item: null }]);
      await fetchNotes();
      setTimeout(() => descRef.current?.focus?.(), 50);
    } catch (err) { setError(err.response?.data?.message || "שגיאה בשמירת תעודת המשלוח"); }
  };

  const handleConvert = async (note) => {
    try {
      const res = await api.post(`/delivery-notes/${note._id}/convert`);
      await fetchNotes();
      if (res.data.customerId) navigate(`/account/${res.data.customerId}`);
    } catch (err) { setError(err.response?.data?.message || "שגיאה בהמרה"); }
  };

  const handleSync = async (note) => {
    if (!window.confirm("פעולה זו תמחק את הרשומות הקיימות בחשבון ותיצור אותן מחדש. להמשיך?")) return;
    try { await api.post(`/delivery-notes/${note._id}/sync`); await fetchNotes(); }
    catch (err) { setError(err.response?.data?.message || "שגיאה בסנכרון"); }
  };
const handlePrint = async (n) => {
  try {
    const res = await api.get(`/delivery-notes/${n._id}`);
    const note = res.data;
    const custName = note.customerName || note.customer?.fullName || "—";
    const custPhone = note.customerPhone || note.customer?.phone || "";

    const rowsHtml = note.items.map(item => `
      <tr>
        <td>${fmtDate(item.date)}</td>
        <td>${item.description || "—"}</td>
        <td style="text-align:center">${item.quantity || "—"}</td>
        <td style="text-align:center">□</td>
      </tr>`).join("");

    const logoHtml = settings?.logoBase64
      ? `<img src="${settings.logoBase64}" style="max-width:280px;max-height:80px;object-fit:contain;display:block" />`
      : `<div style="font-size:22px;font-weight:800;color:#111">${settings?.storeName || ""}</div>`;

    const w = window.open("", "_blank", "width=1000,height=800");
    if (!w) return;

    w.document.write(`
      <html dir="rtl">
      <head>
        <title>תעודת משלוח ${note.noteNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 28px 32px; direction: rtl; color: #111; background: #fff; }
          .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 2px solid #eee; margin-bottom: 18px; }
          .header-left { display: flex; flex-direction: column; gap: 4px; }
          .header-right { text-align: left; font-size: 12px; color: #666; line-height: 1.8; }
          .header-right strong { color: #111; }
          .store-info { font-size: 12px; color: #777; margin-top: 5px; line-height: 1.7; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: right; font-size: 13px; }
          th { background: #f5f5f5; font-weight: 700; color: #444; }
          tr:nth-child(even) { background: #fafafa; }
          .note-box { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 7px; padding: 10px 14px; margin-top: 16px; font-size: 13px; }
          .sign { margin-top: 60px; display: flex; justify-content: space-between; }
          .sign-box { border-top: 1.5px solid #333; width: 200px; text-align: center; padding-top: 8px; font-size: 12px; color: #555; }
          .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>

        <!-- ── Header ── -->
        <div class="header">
          <div class="header-left">
            ${logoHtml}
            <div class="store-info">
              ${settings?.storePhone  ? `<span>טלפון: ${settings.storePhone}</span>` : ""}
              ${settings?.storeAddress ? `<span> · ${settings.storeAddress}</span>` : ""}
            </div>
          </div>
          <div class="header-right">
            <div>מספר תעודה: <strong>${note.noteNumber}</strong></div>
            <div>תאריך: <strong>${fmtDate(note.date)}</strong></div>
            <div>לקוח: <strong>${custName}</strong></div>
            ${custPhone ? `<div>טלפון: <strong>${custPhone}</strong></div>` : ""}
          </div>
        </div>

        <!-- ── Table ── -->
        <table>
          <thead>
            <tr>
              <th>תאריך</th>
              <th>פריט / תיאור</th>
              <th style="text-align:center">כמות</th>
              <th style="text-align:center">התקבל ✓</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <!-- ── Note ── -->
        ${note.note ? `<div class="note-box"><strong>הערה:</strong> ${note.note}</div>` : ""}

        <!-- ── Signatures ── -->
        <div class="sign">
          <div class="sign-box">חתימת מוסר</div>
          <div class="sign-box">חתימת מקבל</div>
        </div>

        <!-- ── Footer ── -->
        ${settings?.footerText
          ? `<div class="footer">${settings.footerText}</div>`
          : ""}

        <script>window.onload = () => window.print()</script>
      </body>
      </html>
    `);
    w.document.close();
  } catch (err) { setError("שגיאה בהדפסה"); }
};
  return (
    <div style={{ direction: "rtl", minHeight: "100vh", background: "#F5F6FA", padding: "16px", boxSizing: "border-box", fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        input:focus, select:focus, textarea:focus { border-color: #AFA9EC !important; box-shadow: 0 0 0 3px #EEEDFE !important; outline: none; }
        .note-card:hover { border-color: #AFA9EC !important; }
        .row-del { opacity: 0; transition: opacity 0.15s; }
        tr:hover .row-del { opacity: 1 !important; }
        .cust-opt:hover { background: #FAFAFE !important; }
        textarea { resize: vertical; }
        .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }
        .form-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        @media (max-width: 540px) {
          .notes-grid { grid-template-columns: 1fr !important; }
          .page-header { padding: 14px 16px !important; }
          .form-section { padding: 14px !important; }
        }
      `}</style>

      {editingNote && <EditNoteModal note={editingNote} onClose={() => setEditingNote(null)} onSaved={fetchNotes} />}

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14, animation: "fadeIn 0.3s ease" }}>

        {/* ── Header ── */}
        <div className="page-header" style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "#534AB7", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>מערכת ניהול חשבונות</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>תעודות משלוח</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>יצירה וניהול של תעודות משלוח ללקוחות</div>
          </div>
          {notes.length > 0 && (
            <div style={{ background: C.gray.bg, color: C.gray.text, border: `0.5px solid ${C.gray.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>{notes.length} תעודות</div>
          )}
        </div>

        {error && <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        {/* ── Form ── */}
        <div className="form-section" style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 18px" }}>
          <SectionBar title="תעודת משלוח חדשה" color="#0F6E56" />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <Field label="לקוח *" style={{ flex: "1 1 200px", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{Icon.search}</div>
                <input
                  value={noteInfo.customer ? noteInfo.customerName : custSearch}
                  onChange={e => { setCustSearch(e.target.value); setNoteInfo(p => ({ ...p, customer: null, customerName: e.target.value })); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="חפש לקוח קיים..."
                  style={{ ...inputStyle, paddingRight: 32, borderColor: custSearch && !noteInfo.customer ? C.amber.border : "#ddd" }}
                />
                {(custSearch || noteInfo.customerName) && (
                  <button onClick={clearCustomer} style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", display: "flex" }}>{Icon.close}</button>
                )}
              </div>
              {custSearch && !noteInfo.customer && <div style={{ fontSize: 11, color: C.amber.text, fontWeight: 600, marginTop: 3 }}>יש לבחור לקוח מהרשימה</div>}
              {showDropdown && filteredCustomers.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0, background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 10, zIndex: 100, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  {filteredCustomers.map(c => {
                    const av = avatarColor(c.fullName);
                    return (
                      <div key={c._id} className="cust-opt" onClick={() => selectCustomer(c)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "0.5px solid #f5f5f5", touchAction: "manipulation" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: av.bg, color: av.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials(c.fullName)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.fullName}</div>
                          {c.phone && <div style={{ fontSize: 11, color: "#aaa" }}>{c.phone}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Field>

            <Field label="תאריך" style={{ flex: "0 0 135px" }}>
              <input type="date" value={noteInfo.date} onChange={e => setNoteInfo(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
            </Field>
          </div>

          <Field label="הערה (אופציונלי)" style={{ marginBottom: 14 }}>
            <textarea value={noteInfo.note} onChange={e => setNoteInfo(p => ({ ...p, note: e.target.value }))} placeholder="הוסף הערה לתעודת המשלוח..." rows={2} style={{ ...inputStyle, lineHeight: 1.6 }} />
          </Field>

          <div className="form-table-wrap" style={{ marginBottom: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 500, border: "0.5px solid #e8e8e8", borderRadius: 10, overflow: "hidden" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #f0f0f0" }}>
                  {["תאריך", "פריט / תיאור", "כמות", "מחיר יחידה", "סכום", ""].map(h => (
                    <th key={h} style={{ padding: "9px 9px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: i < rows.length - 1 ? "0.5px solid #f5f5f5" : "none" }}>
                    <td style={{ padding: "6px 7px", width: 115 }}><input type="date" value={row.date} onChange={e => updateRow(row.id, { date: e.target.value })} style={{ ...inputStyle, fontSize: 12 }} /></td>
                    <td style={{ padding: "6px 7px", minWidth: 150 }}>
                      <input ref={i === 0 ? descRef : null} list="items-list-dn" value={row.description}
                        onChange={e => { const val = e.target.value; const match = items.find(it => it.name === val); if (match) updateRow(row.id, { description: val, unitPrice: match.price || "", item: match._id }); else updateRow(row.id, { description: val, item: null }); }}
                        placeholder="בחר פריט או הקלד..." style={inputStyle} />
                      <datalist id="items-list-dn">{items.map(it => <option key={it._id} value={it.name} />)}</datalist>
                    </td>
                    <td style={{ padding: "6px 7px", width: 65 }}><input type="number" value={row.quantity} onChange={e => updateRow(row.id, { quantity: e.target.value })} placeholder="0" style={{ ...inputStyle, textAlign: "center" }} /></td>
                    <td style={{ padding: "6px 7px", width: 85 }}><input type="number" value={row.unitPrice} onChange={e => updateRow(row.id, { unitPrice: e.target.value })} placeholder="₪" style={{ ...inputStyle, textAlign: "center" }} /></td>
                    <td style={{ padding: "6px 7px", width: 95 }}><input type="number" value={row.amount} onChange={e => updateRow(row.id, { amount: e.target.value })} placeholder="₪" style={{ ...inputStyle, fontWeight: 700, textAlign: "center" }} /></td>
                    <td style={{ padding: "6px 7px", width: 32 }}>
                      <button className="row-del" onClick={() => removeRow(row.id)} style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: C.red.bg, color: C.red.icon, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icon.trash}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5f5f5", color: "#555", border: "0.5px solid #ddd", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>
              {Icon.plus} הוסף שורה
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, color: "#aaa" }}>סה״כ</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{fmtCurrency(total)}</div>
              </div>
              <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 6, background: "#0F6E56", color: "#E1F5EE", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", touchAction: "manipulation", whiteSpace: "nowrap" }}>
                {Icon.save} שמור
              </button>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: "0.5px", background: "#e8e8e8" }} />
          <span style={{ fontSize: 12, color: "#0F6E56", fontWeight: 700 }}>תעודות אחרונות</span>
          <div style={{ flex: 1, height: "0.5px", background: "#e8e8e8" }} />
        </div>

        {/* ── Notes Grid ── */}
        {notes.length === 0 ? (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
            <div style={{ marginBottom: 12, color: "#ddd" }}>{Icon.truck}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#bbb", marginBottom: 6 }}>אין עדיין תעודות משלוח</div>
            <div style={{ fontSize: 12, color: "#ccc" }}>לאחר שמירת תעודת משלוח, היא תופיע כאן.</div>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map(note => {
              const isConverted = note.status === "converted";
              const isDirty = note.isDirty;
              const custName = note.customerName || note.customer?.fullName || "—";
              const av = avatarColor(custName);
              const statusColor = isDirty ? C.orange : isConverted ? C.teal : C.gray;

              return (
                <div key={note._id} className="note-card" style={{ background: "#fff", border: `0.5px solid ${isDirty ? C.orange.border : "#e8e8e8"}`, borderRadius: 14, padding: "16px 16px", display: "flex", flexDirection: "column", gap: 12, transition: "border-color 0.15s" }}>

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: av.bg, color: av.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials(custName)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{custName}</div>
                        <div style={{ fontSize: 11, color: "#aaa", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>{Icon.tag}<span style={{ fontWeight: 600, color: C.teal.text }}>{note.noteNumber}</span></div>
                      </div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0, background: statusColor.bg, fontSize: 10, fontWeight: 600, color: statusColor.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor.icon }} />
                      {isDirty ? "שונה" : isConverted ? "הועבר" : "טיוטה"}
                    </span>
                  </div>

                  {isDirty && (
                    <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 600, color: C.orange.text, display: "flex", alignItems: "center", gap: 6 }}>
                      {Icon.warning} תעודה זו שונתה לאחר ההמרה
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      ["תאריך", fmtDate(note.date), "#555"],
                      ["פריטים", note.items?.length || 0, "#555"],
                      ["סה״כ", fmtCurrency(note.total), "#1a1a1a"],
                      ...(isConverted && note.convertedAt ? [["הועבר", fmtDate(note.convertedAt), C.teal.text]] : []),
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#aaa" }}>{label}</span>
                        <span style={{ fontWeight: 600, color }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                    <button onClick={() => handlePrint(note)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, background: "#fff", color: "#555", border: "0.5px solid #ddd", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>
                      {Icon.print} הדפס
                    </button>
                    <button onClick={() => setEditingNote(note)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, background: C.blue.bg, color: C.blue.text, border: `0.5px solid ${C.blue.border}`, borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>
                      {Icon.edit} ערוך
                    </button>

                    {isConverted ? (
                      <div style={{ display: "flex", gap: 6, width: "100%" }}>
                        <button onClick={() => navigate(`/account/${note.customer?._id || note.customer}`)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, background: C.teal.bg, color: C.teal.text, border: `0.5px solid ${C.teal.border}`, borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", touchAction: "manipulation" }}>
                          {Icon.account} חשבון
                        </button>
                        {isDirty && (
                          <button onClick={() => handleSync(note)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, background: C.orange.bg, color: C.orange.text, border: `0.5px solid ${C.orange.border}`, borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", touchAction: "manipulation" }}>
                            {Icon.sync} עדכן
                          </button>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => handleConvert(note)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", touchAction: "manipulation" }}>
                        {Icon.convert} העבר לחשבון
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
