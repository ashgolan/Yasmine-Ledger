import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

const C = {
  purple: { bg: "#EEEDFE", border: "#AFA9EC", icon: "#534AB7", text: "#3C3489" },
  red: { bg: "#FCEBEB", border: "#F09595", icon: "#A32D2D", text: "#791F1F" },
  amber: { bg: "#FAEEDA", border: "#FAC775", icon: "#854F0B", text: "#633806" },
  teal: { bg: "#E1F5EE", border: "#5DCAA5", icon: "#0F6E56", text: "#085041" },
  blue: { bg: "#E6F1FB", border: "#85B7EB", icon: "#185FA5", text: "#0C447C" },
  gray: { bg: "#F1EFE8", border: "#B4B2A9", icon: "#5F5E5A", text: "#444441" },
};

function fmtCurrency(n) { return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Number(n || 0)); }
function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("he-IL"); }
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
  plus: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  trash: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2h4v2M5 4l1 10h4l1-10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  print: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="4" y="1" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="2" y="6" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M5 13h6M5 10h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  convert: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  account: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" /><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  save: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 14V3l2-1h6l2 2v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><rect x="5" y="9" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3" /></svg>,
  doc: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M6 6h4M6 9h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  phone: <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5L6 7a7.9 7.9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  search: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" /><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  close: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  tag: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 2h5l7 7-5 5-7-7V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><circle cx="5" cy="5" r="1" fill="currentColor" /></svg>,
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

export default function QuotesPage() {
  const navigate = useNavigate();
  const descRef = useRef();

  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [custSearch, setCustSearch] = useState("");

  const [quoteInfo, setQuoteInfo] = useState({
    customer: null, customerName: "", customerPhone: "",
    date: new Date().toISOString().slice(0, 10), note: "",
  });

  const [rows, setRows] = useState([{
    id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10),
    description: "", quantity: "", unitPrice: "", amount: "", item: null,
  }]);

  useEffect(() => {
    Promise.all([api.get("/quotes"), api.get("/customers"), api.get("/items"), api.get("/settings")])
      .then(([q, c, i, s]) => {
        setQuotes(Array.isArray(q.data) ? q.data : []);
        setCustomers(Array.isArray(c.data) ? c.data : []);
        setItems(Array.isArray(i.data) ? i.data : []);
        setSettings(s.data);
      }).catch(err => setError(err.response?.data?.message || "שגיאה בטעינה"));
  }, []);

  const fetchQuotes = async () => {
    const res = await api.get("/quotes");
    setQuotes(Array.isArray(res.data) ? res.data : []);
  };

  const total = useMemo(() => rows.reduce((s, r) => s + Number(r.amount || 0), 0), [rows]);

  const filteredCustomers = useMemo(() => {
    const q = custSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 6);
    return customers.filter(c => (c.fullName || "").toLowerCase().includes(q) || (c.phone || "").includes(q)).slice(0, 6);
  }, [customers, custSearch]);

  const selectCustomer = (c) => {
    setQuoteInfo(p => ({ ...p, customer: c._id, customerName: c.fullName || "", customerPhone: c.phone || "" }));
    setCustSearch(c.fullName || ""); setShowDropdown(false);
  };
  const clearCustomer = () => { setQuoteInfo(p => ({ ...p, customer: null, customerName: "", customerPhone: "" })); setCustSearch(""); };

  const updateRow = (id, patch) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const next = { ...row, ...patch };
      const q = Number(next.quantity || 0), p = Number(next.unitPrice || 0);
      if (q && p) next.amount = q * p;
      return next;
    }));
  };

  const addRow = () => setRows(prev => [...prev, { id: crypto.randomUUID(), date: quoteInfo.date, description: "", quantity: "", unitPrice: "", amount: "", item: null }]);
  const removeRow = (id) => { if (rows.length > 1) setRows(p => p.filter(r => r.id !== id)); };

  const handleSave = async () => {
    const validRows = rows.filter(r => r.description && Number(r.amount || 0) > 0);
    if (!quoteInfo.customerName.trim()) { setError("יש להזין שם לקוח"); return; }
    if (validRows.length === 0) { setError("יש להוסיף לפחות שורה אחת תקינה"); return; }
    try {
      setError("");
      await api.post("/quotes", {
        customer: quoteInfo.customer || null, customerName: quoteInfo.customerName,
        customerPhone: quoteInfo.customerPhone, date: quoteInfo.date, note: quoteInfo.note,
        items: validRows.map(r => ({ date: r.date, description: r.description, quantity: Number(r.quantity || 0), unitPrice: Number(r.unitPrice || 0), amount: Number(r.amount || 0), item: r.item || null })),
      });
      setQuoteInfo({ customer: null, customerName: "", customerPhone: "", date: new Date().toISOString().slice(0, 10), note: "" });
      setCustSearch("");
      setRows([{ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), description: "", quantity: "", unitPrice: "", amount: "", item: null }]);
      await fetchQuotes();
      setTimeout(() => descRef.current?.focus?.(), 50);
    } catch (err) { setError(err.response?.data?.message || "שגיאה בשמירת הצעת המחיר"); }
  };

  const handleConvert = async (quote) => {
    try {
      const res = await api.post(`/quotes/${quote._id}/convert`);
      await fetchQuotes();
      if (res.data.customerId) navigate(`/account/${res.data.customerId}`);
    } catch (err) { setError(err.response?.data?.message || "שגיאה בהמרת הצעת המחיר"); }
  };
  const handlePrint = async (q) => {
    try {
      const res = await api.get(`/quotes/${q._id}`);
      const quote = res.data;
      const custName = quote.customerName || quote.customer?.fullName || "—";
      const custPhone = quote.customerPhone || quote.customer?.phone || "—";

      const rowsHtml = quote.items.map(item => `
      <tr>
        <td>${fmtDate(item.date)}</td>
        <td>${item.description || "—"}</td>
        <td style="text-align:center">${item.quantity || "—"}</td>
        <td style="text-align:center">${item.unitPrice || "—"}</td>
        <td style="text-align:left;font-weight:700">${Number(item.amount || 0).toLocaleString("he-IL")} ₪</td>
      </tr>`).join("");

      const logoHtml = settings?.logoBase64
        ? `<img src="${settings.logoBase64}" style="max-width:280px;max-height:80px;object-fit:contain;display:block" />`
        : `<div style="font-size:22px;font-weight:800;color:#111">${settings?.storeName || ""}</div>`;

      const w = window.open("", "_blank", "width=1000,height=800");
      if (!w) return;

      w.document.write(`
      <html dir="rtl">
      <head>
        <title>הצעת מחיר — ${quote.quoteNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 28px 32px; direction: rtl; color: #111; background: #fff; }
          .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 2px solid #eee; margin-bottom: 18px; }
          .header-left { display: flex; flex-direction: column; gap: 4px; }
          .header-right { text-align: left; font-size: 12px; color: #666; line-height: 1.8; }
          .header-right strong { color: #111; }
          .store-info { font-size: 12px; color: #777; margin-top: 5px; line-height: 1.7; }
          .customer-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; line-height: 1.8; }
          .customer-box .name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 9px 11px; text-align: right; font-size: 13px; }
          th { background: #f5f5f5; font-weight: 700; color: #444; }
          tr:nth-child(even) { background: #fafafa; }
          .total-box { margin-top: 16px; display: flex; justify-content: flex-start; }
          .total-inner { background: #EEEDFE; border: 1px solid #AFA9EC; border-radius: 8px; padding: 10px 20px; display: flex; align-items: center; gap: 12px; }
          .total-label { font-size: 13px; color: #534AB7; font-weight: 600; }
          .total-value { font-size: 20px; font-weight: 800; color: #3C3489; }
          .note-box { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 7px; padding: 10px 14px; margin-top: 16px; font-size: 13px; }
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
              ${settings?.storePhone ? `<span>טלפון: ${settings.storePhone}</span>` : ""}
              ${settings?.storeAddress ? `<span> · ${settings.storeAddress}</span>` : ""}
            </div>
          </div>
          <div class="header-right">
            <div>מספר הצעה: <strong>${quote.quoteNumber}</strong></div>
            <div>תאריך: <strong>${fmtDate(quote.date)}</strong></div>
            <div>סטטוס: <strong>${quote.status === "converted" ? "הומר לחשבון" : "טיוטה"}</strong></div>
          </div>
        </div>

        <!-- ── Customer ── -->
        <div class="customer-box">
          <div class="name">${custName}</div>
          ${custPhone !== "—" ? `<div>טלפון: ${custPhone}</div>` : ""}
        </div>

        <!-- ── Table ── -->
        <table>
          <thead>
            <tr>
              <th>תאריך</th>
              <th>פריט / תיאור</th>
              <th style="text-align:center">כמות</th>
              <th style="text-align:center">מחיר יחידה</th>
              <th style="text-align:left">סכום</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <!-- ── Total ── -->
        <div class="total-box">
          <div class="total-inner">
            <span class="total-label">סה״כ לתשלום</span>
            <span class="total-value">${Number(quote.total || 0).toLocaleString("he-IL")} ₪</span>
          </div>
        </div>

        <!-- ── Note ── -->
        ${quote.note ? `<div class="note-box"><strong>הערה:</strong> ${quote.note}</div>` : ""}

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
    <div style={{
      direction: "rtl", minHeight: "100vh", background: "#F5F6FA",
      padding: "16px", boxSizing: "border-box",
      fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        input:focus, select:focus, textarea:focus { border-color: #AFA9EC !important; box-shadow: 0 0 0 3px #EEEDFE !important; outline: none; }
        .quote-card:hover { border-color: #AFA9EC !important; }
        .row-del { opacity: 0; transition: opacity 0.15s; }
        tr:hover .row-del { opacity: 1 !important; }
        .cust-opt:hover { background: #FAFAFE !important; }
        textarea { resize: vertical; }

        /* جدول الفورم قابل للتمرير */
        .quote-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

        /* شبكة البطاقات */
        .quotes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }

        @media (max-width: 540px) {
          .quotes-grid  { grid-template-columns: 1fr !important; }
          .q-header     { padding: 14px 16px !important; }
          .q-form       { padding: 14px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14, animation: "fadeIn 0.3s ease" }}>

        {/* ── Header ── */}
        <div className="q-header" style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#534AB7", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>מערכת ניהול חשבונות</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>הצעות מחיר</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>יצירה וניהול של הצעות מחיר ללקוחות</div>
          </div>
          {!quoteInfo.customer && quoteInfo.customerName.trim() && (
            <div style={{ background: C.blue.bg, color: C.blue.text, border: `0.5px solid ${C.blue.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
              לקוח חדש ייווצר אוטומטית
            </div>
          )}
        </div>

        {error && <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        {/* ── New quote form ── */}
        <div className="q-form" style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 18px" }}>
          <SectionBar title="הצעת מחיר חדשה" color="#854F0B" />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>

            {/* Customer autocomplete */}
            <Field label="לקוח" style={{ flex: "1 1 200px", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{Icon.search}</div>
                <input
                  value={quoteInfo.customer ? quoteInfo.customerName : custSearch}
                  onChange={e => { setCustSearch(e.target.value); setQuoteInfo(p => ({ ...p, customer: null, customerName: e.target.value })); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="חפש לקוח קיים או הזן שם חדש..."
                  style={{ ...inputStyle, paddingRight: 32 }}
                />
                {(custSearch || quoteInfo.customerName) && (
                  <button onClick={clearCustomer} style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", display: "flex" }}>{Icon.close}</button>
                )}
              </div>
              {showDropdown && filteredCustomers.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0, background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 10, zIndex: 100, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  {filteredCustomers.map(c => {
                    const av = avatarColor(c.fullName);
                    return (
                      <div key={c._id} className="cust-opt" onMouseDown={(e) => { e.preventDefault(); selectCustomer(c) }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "0.5px solid #f5f5f5", touchAction: "manipulation" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: av.bg, color: av.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials(c.fullName)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.fullName}</div>
                          {c.phone && <div style={{ fontSize: 11, color: "#aaa" }}>{c.phone}</div>}
                        </div>
                        <div style={{ fontSize: 10, background: C.purple.bg, color: C.purple.text, borderRadius: 20, padding: "2px 8px", fontWeight: 600, flexShrink: 0 }}>לקוח קיים</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Field>

            <Field label="טלפון" style={{ flex: "1 1 130px" }}>
              <input value={quoteInfo.customerPhone} onChange={e => setQuoteInfo(p => ({ ...p, customerPhone: e.target.value }))} placeholder="050-0000000" style={inputStyle} />
            </Field>

            <Field label="תאריך" style={{ flex: "0 0 135px" }}>
              <input type="date" value={quoteInfo.date} onChange={e => setQuoteInfo(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
            </Field>
          </div>

          <Field label="הערה (אופציונלי)" style={{ marginBottom: 14 }}>
            <textarea value={quoteInfo.note} onChange={e => setQuoteInfo(p => ({ ...p, note: e.target.value }))} placeholder="הוסף הערה להצעת המחיר..." rows={2} style={{ ...inputStyle, lineHeight: 1.6 }} />
          </Field>

          {/* جدول مع scroll أفقي */}
          <div className="quote-table-wrap" style={{ marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520, border: "0.5px solid #e8e8e8", borderRadius: 10, overflow: "hidden" }}>
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
                    <td style={{ padding: "7px 8px", width: 115 }}>
                      <input type="date" value={row.date} onChange={e => updateRow(row.id, { date: e.target.value })} style={{ ...inputStyle, fontSize: 12 }} />
                    </td>
                    <td style={{ padding: "7px 8px", minWidth: 160 }}>
                      <input ref={i === 0 ? descRef : null} list="items-list" value={row.description}
                        onChange={e => {
                          const val = e.target.value;
                          const match = items.find(it => it.name === val);
                          if (match) updateRow(row.id, { description: val, unitPrice: match.price || "", item: match._id });
                          else updateRow(row.id, { description: val, item: null });
                        }}
                        placeholder="בחר פריט או הקלד..." style={inputStyle} />
                      <datalist id="items-list">{items.map(it => <option key={it._id} value={it.name} />)}</datalist>
                    </td>
                    <td style={{ padding: "7px 8px", width: 65 }}>
                      <input type="number" value={row.quantity} onChange={e => updateRow(row.id, { quantity: e.target.value })} placeholder="0" style={{ ...inputStyle, textAlign: "center" }} />
                    </td>
                    <td style={{ padding: "7px 8px", width: 90 }}>
                      <input type="number" value={row.unitPrice} onChange={e => updateRow(row.id, { unitPrice: e.target.value })} placeholder="₪" style={{ ...inputStyle, textAlign: "center" }} />
                    </td>
                    <td style={{ padding: "7px 8px", width: 95 }}>
                      <input type="number" value={row.amount} onChange={e => updateRow(row.id, { amount: e.target.value })} placeholder="₪" style={{ ...inputStyle, fontWeight: 700, textAlign: "center" }} />
                    </td>
                    <td style={{ padding: "7px 8px", width: 32 }}>
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
                <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500 }}>סה״כ</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{fmtCurrency(total)}</div>
              </div>
              <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 6, background: "#854F0B", color: "#FAEEDA", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", touchAction: "manipulation", whiteSpace: "nowrap" }}>
                {Icon.save} שמור
              </button>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: "0.5px", background: "#e8e8e8" }} />
          <span style={{ fontSize: 12, color: "#854F0B", fontWeight: 700 }}>הצעות אחרונות</span>
          <div style={{ flex: 1, height: "0.5px", background: "#e8e8e8" }} />
        </div>

        {/* ── Quotes Grid ── */}
        {quotes.length === 0 ? (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
            <div style={{ marginBottom: 12, color: "#ddd" }}>{Icon.doc}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#bbb", marginBottom: 6 }}>אין עדיין הצעות מחיר</div>
            <div style={{ fontSize: 12, color: "#ccc" }}>לאחר שמירת הצעת מחיר, היא תופיע כאן.</div>
          </div>
        ) : (
          <div className="quotes-grid">
            {quotes.map(quote => {
              const isConverted = quote.status === "converted";
              const custName = quote.customerName || quote.customer?.fullName || "—";
              const av = avatarColor(custName);
              const statusColor = isConverted ? C.teal : C.gray;

              return (
                <div key={quote._id} className="quote-card" style={{
                  background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14,
                  padding: "16px 16px", display: "flex", flexDirection: "column", gap: 12,
                  transition: "border-color 0.15s",
                }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: av.bg, color: av.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials(custName)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{custName}</div>
                        <div style={{ fontSize: 11, color: "#aaa", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                          {Icon.tag}<span style={{ fontWeight: 600, color: C.amber.text }}>{quote.quoteNumber}</span>
                        </div>
                      </div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0, background: statusColor.bg, fontSize: 10, fontWeight: 600, color: statusColor.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor.icon }} />
                      {isConverted ? "הומר" : "טיוטה"}
                    </span>
                  </div>

                  {/* Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      ["תאריך", fmtDate(quote.date)],
                      ["טלפון", quote.customerPhone || quote.customer?.phone || "—"],
                      ["פריטים", quote.items?.length || 0],
                      ...(isConverted && quote.convertedAt ? [["הומר", fmtDate(quote.convertedAt)]] : []),
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#aaa" }}>{label}</span>
                        <span style={{ fontWeight: 600, color: label === "הומר" ? C.teal.text : "#555" }}>{val}</span>
                      </div>
                    ))}
                    {!quote.customer && quote.customerName && (
                      <div style={{ fontSize: 11, color: C.blue.text, fontWeight: 600, background: C.blue.bg, borderRadius: 6, padding: "3px 8px", marginTop: 2 }}>לקוח חדש / לא מקושר</div>
                    )}
                  </div>

                  {/* Total */}
                  <div style={{ background: "#FAFAFA", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <span style={{ fontSize: 11, color: "#aaa", fontWeight: 500 }}>סה״כ</span>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a" }}>{fmtCurrency(quote.total)}</span>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 7 }}>
                    <button onClick={() => handlePrint(quote)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "#fff", color: "#555", border: "0.5px solid #ddd", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>
                      {Icon.print} הדפס
                    </button>
                    {isConverted ? (
                      <button onClick={() => navigate(`/account/${quote.customer?._id || quote.customer}`)} disabled={!quote.customer}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: quote.customer ? C.teal.bg : "#f5f5f5", color: quote.customer ? C.teal.text : "#bbb", border: `0.5px solid ${quote.customer ? C.teal.border : "#ddd"}`, borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: quote.customer ? "pointer" : "not-allowed", touchAction: "manipulation" }}>
                        {Icon.account} חשבון
                      </button>
                    ) : (
                      <button onClick={() => handleConvert(quote)} disabled={!quote.items?.length || !(quote.customer || quote.customerName?.trim())}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", touchAction: "manipulation", opacity: (!quote.items?.length || !(quote.customer || quote.customerName?.trim())) ? 0.5 : 1 }}>
                        {Icon.convert} המר
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
