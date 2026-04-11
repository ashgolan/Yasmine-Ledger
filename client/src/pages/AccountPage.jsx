import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  purple: { bg: "#EEEDFE", border: "#AFA9EC", icon: "#534AB7", text: "#3C3489" },
  red:    { bg: "#FCEBEB", border: "#F09595", icon: "#A32D2D", text: "#791F1F" },
  amber:  { bg: "#FAEEDA", border: "#EF9F27", icon: "#854F0B", text: "#633806" },
  teal:   { bg: "#E1F5EE", border: "#5DCAA5", icon: "#0F6E56", text: "#085041" },
  blue:   { bg: "#E6F1FB", border: "#85B7EB", icon: "#185FA5", text: "#0C447C" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCurrency(n) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Number(n || 0));
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL");
}
function getTypeInfo(type) {
  if (type === "debt")    return { label: "חוב",    color: C.red,   prefix: "+" };
  if (type === "payment") return { label: "תשלום",  color: C.teal,  prefix: "−" };
  return                         { label: "החזרה",  color: C.amber, prefix: "−" };
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  wallet:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 4V3.5a3 3 0 016 0V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="11" cy="8.5" r="1" fill="currentColor"/></svg>,
  up:      <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  down:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  receipt: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M6 6h4M6 9h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  print:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="4" y="1" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="6" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 13h6M5 10h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  plus:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  edit:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  trash:   <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2h4v2M5 4l1 10h4l1-10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  save:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 14V3l2-1h6l2 2v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><rect x="5" y="9" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  close:   <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  back:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  archive: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 6l2-3h8l2 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6 9.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, highlight }) {
  return (
    <div style={{
      background: highlight ? color.bg : "#fff",
      border: highlight ? `1.5px solid ${color.border}` : "0.5px solid #e8e8e8",
      borderRadius: 14,
      padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1,
      transition: "background 0.3s, border 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: highlight ? color.icon : "#888", fontWeight: 600 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: highlight ? color.icon : color.bg, color: highlight ? "#fff" : color.icon, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: highlight ? 28 : 22, fontWeight: 800, color: color.text, lineHeight: 1, transition: "font-size 0.3s" }}>{value}</div>
      {highlight && (
        <div style={{ height: 3, borderRadius: 99, background: color.border, opacity: 0.4 }} />
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const { label, color } = getTypeInfo(type);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
      minWidth: 68, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap",
      background: color.bg, fontSize: 11, fontWeight: 600, color: color.text,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color.icon, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
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
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type: "debt",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    quantity: "",
    unitPrice: "",
    amount: "",
    note: "",
  });

  // refs for keyboard nav
  const dateRef = useRef(); const typeRef = useRef();
  const descRef = useRef(); const qtyRef = useRef();
  const priceRef = useRef(); const amtRef = useRef();

  const fetchData = async () => {
    try {
      setLoading(true); setError("");
      const [accRes, itemsRes, settingsRes, archRes] = await Promise.all([
        api.get(`/accounts/customer/${customerId}/open`),
        api.get("/items"),
        api.get("/settings"),
        api.get(`/accounts/customer/${customerId}/archived`),
      ]);
      setData(accRes.data);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setSettings(settingsRes.data);
      setArchivedAccounts(Array.isArray(archRes.data) ? archRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (customerId) fetchData(); }, [customerId]);

  // ── Keyboard nav ──
  const focus = (ref) => {
    setTimeout(() => {
      const el = ref?.current?.querySelector?.("input,select,textarea") || ref?.current;
      el?.focus?.(); el?.select?.();
    }, 30);
  };

  const handleKey = async (e, field) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const nav = { date: typeRef, type: descRef, quantity: priceRef, unitPrice: amtRef };
    if (field === "description") { focus(form.type === "payment" ? amtRef : qtyRef); return; }
    if (field === "amount") { await handleAdd(); focus(dateRef); return; }
    if (nav[field]) focus(nav[field]);
  };

  // ── Add transaction ──
  const handleAdd = async () => {
    if (!form.amount || !form.date || !form.type) return;
    try {
      await api.post(`/transactions`, {
        accountId: data?.account?._id,
        type: form.type, date: form.date,
        description: form.description,
        quantity: Number(form.quantity || 0),
        unitPrice: Number(form.unitPrice || 0),
        amount: Number(form.amount),
        note: form.note || "",
      });
      setForm(f => ({ ...f, description: "", quantity: "", unitPrice: "", amount: "", note: "" }));
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בהוספת עסקה");
    }
  };

  // ── Edit ──
  const startEdit = (t) => {
    setEditingId(t._id);
    setEditForm({ date: t.date ? new Date(t.date).toISOString().slice(0,10) : "", type: t.type, description: t.description || "", quantity: t.quantity ?? "", unitPrice: t.unitPrice ?? "", amount: t.amount ?? "", note: t.note || "" });
  };
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
    try {
      await api.put(`/transactions/${id}`, editForm);
      setEditingId(null); setEditForm({});
      await fetchData();
    } catch (err) { setError(err.response?.data?.message || "שגיאה בעדכון"); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("האם למחוק את השורה?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      await fetchData();
    } catch (err) { setError(err.response?.data?.message || "שגיאה במחיקה"); }
  };

  // ── Print ──
  const handlePrint = () => {
    if (!data) return;
    const { transactions, balance } = data;
    const debtsTotal    = transactions.filter(t => t.type === "debt").reduce((s,t) => s + Number(t.amount||0), 0);
    const paymentsTotal = transactions.filter(t => t.type === "payment").reduce((s,t) => s + Number(t.amount||0), 0);
    const returnsTotal  = transactions.filter(t => t.type === "return").reduce((s,t) => s + Number(t.amount||0), 0);
    const rows = transactions.map(t => `
      <tr><td>${fmtDate(t.date)}</td><td>${getTypeInfo(t.type).label}</td><td>${t.description||"—"}</td>
      <td>${t.type==="payment"?"—":t.quantity||"—"}</td><td>${t.type==="payment"?"—":t.unitPrice||"—"}</td>
      <td>${Number(t.amount||0).toLocaleString("he-IL")} ₪</td></tr>`).join("");
    const w = window.open("","_blank","width=1000,height=800");
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>חשבון לקוח</title>
    <style>body{font-family:Arial;padding:24px;direction:rtl;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:10px;text-align:right;font-size:13px}th{background:#f5f5f5}.sum{margin-top:20px}.bal{font-size:20px;font-weight:700;margin-top:12px}</style></head>
    <body><h2>${settings?.storeName||"חנות"}</h2><p>טלפון: ${settings?.storePhone||"—"}</p><p>תאריך: ${fmtDate(new Date())}</p>
    <table><thead><tr><th>תאריך</th><th>סוג</th><th>תיאור</th><th>כמות</th><th>מחיר</th><th>סכום</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="sum"><div>חובות: ${debtsTotal.toLocaleString("he-IL")} ₪</div><div>תשלומים: ${paymentsTotal.toLocaleString("he-IL")} ₪</div><div>החזרות: ${returnsTotal.toLocaleString("he-IL")} ₪</div>
    <div class="bal">יתרה: ${Number(balance||0).toLocaleString("he-IL")} ₪</div></div>
    ${settings?.footerText?`<p style="margin-top:24px;color:#555">${settings.footerText}</p>`:""}
    <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F5F6FA", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif" }}>
      <div style={{ color: "#aaa", fontSize: 14 }}>טוען...</div>
    </div>
  );

  const { transactions = [], balance = 0, account = {} } = data || {};
  const debtsTotal    = transactions.filter(t => t.type === "debt").reduce((s,t) => s + Number(t.amount||0), 0);
  const paymentsTotal = transactions.filter(t => t.type === "payment").reduce((s,t) => s + Number(t.amount||0), 0);
  const returnsTotal  = transactions.filter(t => t.type === "return").reduce((s,t) => s + Number(t.amount||0), 0);

  return (
    <div style={{
      direction: "rtl", minHeight: "100vh", background: "#F5F6FA",
      padding: "24px", fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
      boxSizing: "border-box",
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .tx-row:hover { background: #fafafe !important; }
        .tx-row:hover .row-actions { opacity: 1 !important; }
        input:focus, select:focus { border-color: #AFA9EC !important; box-shadow: 0 0 0 3px #EEEDFE !important; }
        .tab-btn { border: none; background: none; cursor: pointer; padding: 10px 18px; font-size: 13px; font-weight: 600; color: #aaa; border-bottom: 2px solid transparent; transition: all 0.15s; font-family: inherit; }
        .tab-btn.active { color: #534AB7; border-bottom-color: #534AB7; }
        .icon-btn { border: none; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; font-family: inherit; }
        .note-wrap:hover .note-tooltip { opacity: 1 !important; }
      `}</style>

      {/* Archive Modal */}
      {archiveOpen && selectedArchive && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setArchiveOpen(false)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 800, maxHeight: "80vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>פרטי חשבון בארכיון</div>
              <button className="icon-btn" onClick={() => setArchiveOpen(false)} style={{ width: 28, height: 28, background: "#f5f5f5", color: "#888" }}>{Icon.close}</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.red.text, marginBottom: 16 }}>
              יתרה סופית: {fmtCurrency(selectedArchive.finalBalance || selectedArchive.balance || 0)}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #f0f0f0" }}>
                  {["תאריך","סוג","תיאור","כמות","מחיר","סכום"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#888", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedArchive.transactions?.map((t, i) => {
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
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>

        {/* ── Header ── */}
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="icon-btn" onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: "#f5f5f5", color: "#666", flexShrink: 0 }}>{Icon.back}</button>
            {(() => {
              const name = data?.account?.customer?.fullName || data?.account?.customer?.name || "לקוח";
              const words = name.trim().split(/\s+/);
              const initials = words.length === 1 ? words[0].slice(0,2) : `${words[0][0]}${words[words.length-1][0]}`;
              const colors = [["#EEEDFE","#3C3489"],["#E1F5EE","#085041"],["#E6F1FB","#0C447C"],["#FBEAF0","#72243E"],["#FAEEDA","#633806"]];
              const [avatarBg, avatarText] = colors[name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % colors.length];
              const firstName = words[0] || "";
              const lastName = words.slice(1).join(" ") || "";
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarBg, color: avatarText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0, outline: "3px solid #FED7AA", outlineOffset: "2px" }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#534AB7", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>חשבון לקוח</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{firstName}</span>
                      {lastName && <span style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{lastName}</span>}
                    </div>
                    {data?.account?.customer?.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, color: "#aaa", fontSize: 12 }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5L6 7a7.9 7.9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                        <span>{data.account.customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
          <button onClick={handlePrint} style={{
            display: "flex", alignItems: "center", gap: 6, background: "#fff",
            border: "0.5px solid #ddd", borderRadius: 9, padding: "9px 18px",
            fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer",
          }}>
            {Icon.print} הדפס חשבון
          </button>
        </div>

        {error && (
          <div style={{ background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{error}</div>
        )}

        {/* ── Tabs ── */}
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "0.5px solid #f0f0f0", padding: "0 20px" }}>
            <button className={`tab-btn${tab === 0 ? " active" : ""}`} onClick={() => setTab(0)}>חשבון נוכחי</button>
            <button className={`tab-btn${tab === 1 ? " active" : ""}`} onClick={() => setTab(1)}>ארכיון</button>
          </div>

          {tab === 0 && (
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ── Stat cards ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Balance — full width */}
                {(() => {
                  const isDebt = Number(balance) > 0;
                  const card = isDebt
                    ? { bg: "#FCEBEB", border: "#F09595", numColor: "#A32D2D", badgeBg: "#E24B4A", iconBg: "#E24B4A", label: "חוב פתוח" }
                    : { bg: "#E1F5EE", border: "#5DCAA5", numColor: "#0F6E56", badgeBg: "#1D9E75", iconBg: "#1D9E75", label: "מאוזן" };
                  return (
                    <div style={{
                      background: card.bg,
                      border: `1.5px solid ${card.border}`,
                      borderRadius: 14,
                      padding: "20px 28px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "background 0.3s, border-color 0.3s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: card.iconBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {Icon.wallet}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: card.numColor, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>יתרת חוב</div>
                          <div style={{ fontSize: 32, fontWeight: 800, color: card.numColor, lineHeight: 1 }}>{fmtCurrency(balance)}</div>
                        </div>
                      </div>
                      <div style={{
                        background: card.badgeBg, color: "#fff",
                        borderRadius: 20, padding: "6px 18px",
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {card.label}
                      </div>
                    </div>
                  );
                })()}

                {/* 3 small cards */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <StatCard label="סה״כ חובות" value={fmtCurrency(debtsTotal)} icon={Icon.up} color={C.red} />
                  <StatCard label="סה״כ תשלומים" value={fmtCurrency(paymentsTotal)} icon={Icon.down} color={C.teal} />
                  <StatCard label="סה״כ עסקאות" value={transactions.length} icon={Icon.receipt} color={C.purple} />
                </div>

              </div>

              {/* ── Add transaction form ── */}
              <div style={{ background: "#FAFBFF", border: "0.5px solid #E8E8F0", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 3, height: 16, background: "#534AB7", borderRadius: 99 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: "0.05em", textTransform: "uppercase" }}>הוסף עסקה</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>

                  <Field label="תאריך" style={{ flex: "0 0 140px" }}>
                    <input ref={dateRef} type="date" value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      onKeyDown={e => handleKey(e, "date")} style={inputStyle} />
                  </Field>

                  <Field label="סוג פעולה" style={{ flex: "0 0 120px" }}>
                    <select ref={typeRef} value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value, description: "", quantity: "", unitPrice: "", amount: "" })}
                      onKeyDown={e => handleKey(e, "type")} style={selectStyle}>
                      <option value="debt">חוב</option>
                      <option value="payment">תשלום</option>
                      <option value="return">החזרה</option>
                    </select>
                  </Field>

                  {form.type === "payment" ? (
                    <Field label="תיאור" style={{ flex: "1 1 180px" }}>
                      <input ref={descRef} value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        onKeyDown={e => handleKey(e, "description")}
                        placeholder="פרט את אמצעי התשלום..."
                        style={inputStyle} />
                    </Field>
                  ) : (
                    <Field label="פריט" style={{ flex: "1 1 180px" }}>
                      <input ref={descRef} list="items-list" value={form.description}
                        onChange={e => {
                          const val = e.target.value;
                          const match = items.find(i => i.name === val);
                          if (match) {
                            const qty = Number(form.quantity || 0);
                            const amt = qty && match.price ? qty * match.price : "";
                            setForm(f => ({ ...f, description: val, unitPrice: match.price || "", amount: amt.toString() }));
                          } else {
                            setForm(f => ({ ...f, description: val }));
                          }
                        }}
                        onKeyDown={e => handleKey(e, "description")}
                        placeholder="בחר פריט או הקלד..."
                        style={inputStyle} />
                      <datalist id="items-list">
                        {items.map(i => <option key={i._id || i.id} value={i.name} />)}
                      </datalist>
                    </Field>
                  )}

                  {form.type !== "payment" && (
                    <Field label="כמות" style={{ flex: "0 0 80px" }}>
                      <input ref={qtyRef} type="number" value={form.quantity}
                        onChange={e => {
                          const q = e.target.value;
                          const p = form.unitPrice || "";
                          setForm(f => ({ ...f, quantity: q, amount: q && p ? String(Number(q) * Number(p)) : f.amount }));
                        }}
                        onKeyDown={e => handleKey(e, "quantity")}
                        placeholder="0" style={inputStyle} />
                    </Field>
                  )}

                  {form.type !== "payment" && (
                    <Field label="מחיר יחידה" style={{ flex: "0 0 100px" }}>
                      <input ref={priceRef} type="number" value={form.unitPrice}
                        onChange={e => {
                          const p = e.target.value;
                          const q = form.quantity || "";
                          setForm(f => ({ ...f, unitPrice: p, amount: q && p ? String(Number(q) * Number(p)) : f.amount }));
                        }}
                        onKeyDown={e => handleKey(e, "unitPrice")}
                        placeholder="₪" style={inputStyle} />
                    </Field>
                  )}

                  <Field label="סכום" style={{ flex: "0 0 110px" }}>
                    <input ref={amtRef} type="number" value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      onKeyDown={e => handleKey(e, "amount")}
                      placeholder="₪" style={{ ...inputStyle, fontWeight: 700 }} />
                  </Field>

                  <div style={{ paddingBottom: 1 }}>
                    <button onClick={handleAdd} style={{
                      background: "#534AB7", color: "#fff", border: "none", borderRadius: 8,
                      padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6, height: 36,
                    }}>
                      {Icon.plus} הוסף
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <Field label="הערה (אופציונלי)">
                    <input
                      value={form.note}
                      onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="הוסף הערה לעסקה..."
                      style={{ ...inputStyle, color: "#555" }}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Transactions table ── */}
              <div style={{ border: "0.5px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #f0f0f0" }}>
                      {["תאריך","סוג","תיאור / פריט","כמות","מחיר","סכום","הערה","פעולות"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: 13 }}>אין עסקאות עדיין</td></tr>
                    )}
                    {transactions.map((t, i) => {
                      const isEditing = editingId === t._id;
                      const { color, prefix } = getTypeInfo(t.type);
                      return (
                        <tr key={t._id} className="tx-row" style={{ borderBottom: i < transactions.length - 1 ? "0.5px solid #f5f5f5" : "none", background: "#fff", transition: "background 0.12s" }}>

                          <td style={{ padding: "11px 14px", color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>
                            {isEditing
                              ? <input type="date" value={editForm.date||""} onChange={e => handleEditChange("date", e.target.value)} style={{ ...inputStyle, width: 130 }} />
                              : fmtDate(t.date)}
                          </td>

                          <td style={{ padding: "11px 14px" }}>
                            {isEditing
                              ? <select value={editForm.type||""} onChange={e => handleEditChange("type", e.target.value)} style={{ ...selectStyle, width: 110 }}>
                                  <option value="debt">חוב</option>
                                  <option value="payment">תשלום</option>
                                  <option value="return">החזרה</option>
                                </select>
                              : <TypeBadge type={t.type} />}
                          </td>

                          <td style={{ padding: "11px 14px", color: "#1a1a1a" }}>
                            {isEditing
                              ? <input value={editForm.description||""} onChange={e => handleEditChange("description", e.target.value)} style={{ ...inputStyle, width: 160 }} />
                              : t.description || "—"}
                          </td>

                          <td style={{ padding: "11px 14px", color: "#888", fontSize: 12 }}>
                            {isEditing
                              ? editForm.type !== "payment"
                                ? <input type="number" value={editForm.quantity||""} onChange={e => handleEditChange("quantity", e.target.value)} style={{ ...inputStyle, width: 70 }} />
                                : "—"
                              : t.type === "payment" ? "—" : t.quantity || "—"}
                          </td>

                          <td style={{ padding: "11px 14px", color: "#888", fontSize: 12 }}>
                            {isEditing
                              ? editForm.type !== "payment"
                                ? <input type="number" value={editForm.unitPrice||""} onChange={e => handleEditChange("unitPrice", e.target.value)} style={{ ...inputStyle, width: 80 }} />
                                : "—"
                              : t.type === "payment" ? "—" : t.unitPrice ? `₪ ${t.unitPrice}` : "—"}
                          </td>

                          <td style={{ padding: "11px 14px", fontWeight: 700, color: color.text, whiteSpace: "nowrap" }}>
                            {isEditing
                              ? <input type="number" value={editForm.amount||""} onChange={e => handleEditChange("amount", e.target.value)} style={{ ...inputStyle, width: 90, fontWeight: 700 }} />
                              : `${prefix}${fmtCurrency(t.amount)}`}
                          </td>

                          <td style={{ padding: "11px 14px", position: "relative" }}>
                            {isEditing ? (
                              <input value={editForm.note||""} onChange={e => handleEditChange("note", e.target.value)} placeholder="הערה..." style={{ ...inputStyle, width: 140, fontSize: 12 }} />
                            ) : t.note ? (
                              <div className="note-wrap" style={{ position: "relative", display: "inline-block" }}>
                                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#FAEEDA", color: "#854F0B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
                                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 2h12v9H9l-3 3V11H2V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                                </div>
                                <div className="note-tooltip" style={{ position: "absolute", bottom: "calc(100% + 10px)", right: 0, background: "#fff", border: "0.5px solid #FAC775", borderRadius: 10, padding: "10px 14px", width: 220, whiteSpace: "normal", lineHeight: 1.6, zIndex: 100, pointerEvents: "none", opacity: 0, transition: "opacity 0.15s", boxShadow: "0 4px 16px rgba(186,117,23,0.12)" }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#854F0B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>הערה</div>
                                  <div style={{ fontSize: 13, color: "#444", fontWeight: 400 }}>{t.note}</div>
                                  <div style={{ position: "absolute", bottom: -5, right: 12, width: 9, height: 9, background: "#fff", border: "0.5px solid #FAC775", borderTop: "none", borderRight: "none", transform: "rotate(-45deg)" }} />
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#ddd", fontSize: 11 }}>—</span>
                            )}
                          </td>

                          <td style={{ padding: "11px 14px" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button className="icon-btn" onClick={() => saveEdit(t._id)} style={{ width: 28, height: 28, background: C.teal.bg, color: C.teal.icon }} title="שמור">{Icon.save}</button>
                                <button className="icon-btn" onClick={cancelEdit} style={{ width: 28, height: 28, background: "#f5f5f5", color: "#888" }} title="ביטול">{Icon.close}</button>
                              </div>
                            ) : (
                              <div className="row-actions" style={{ display: "flex", gap: 6, opacity: 0, transition: "opacity 0.15s" }}>
                                <button className="icon-btn" onClick={() => startEdit(t)} style={{ width: 28, height: 28, background: C.blue.bg, color: C.blue.icon }} title="עריכה">{Icon.edit}</button>
                                <button className="icon-btn" onClick={() => handleDelete(t._id)} style={{ width: 28, height: 28, background: C.red.bg, color: C.red.icon }} title="מחיקה">{Icon.trash}</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>ארכיון חשבונות</div>
              {archivedAccounts.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: "#ccc" }}>
                  <div style={{ marginBottom: 8 }}>{Icon.archive}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#ccc" }}>אין חשבונות בארכיון</div>
                </div>
              ) : (
                <div style={{ border: "0.5px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #f0f0f0" }}>
                        {["תאריך פתיחה","תאריך ארכוב","חובות","תשלומים","החזרות","מאזן סופי","שורות",""].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#888" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {archivedAccounts.map((item, i) => (
                        <tr key={item.account._id} className="tx-row" style={{ borderBottom: i < archivedAccounts.length - 1 ? "0.5px solid #f5f5f5" : "none", background: "#fff" }}>
                          <td style={{ padding: "11px 14px", color: "#888", fontSize: 12 }}>{fmtDate(item.account.openedAt)}</td>
                          <td style={{ padding: "11px 14px", color: "#888", fontSize: 12 }}>{fmtDate(item.account.archivedAt)}</td>
                          <td style={{ padding: "11px 14px", fontWeight: 600, color: C.red.text }}>{fmtCurrency(item.debtsTotal)}</td>
                          <td style={{ padding: "11px 14px", fontWeight: 600, color: C.teal.text }}>{fmtCurrency(item.paymentsTotal)}</td>
                          <td style={{ padding: "11px 14px", fontWeight: 600, color: C.amber.text }}>{fmtCurrency(item.returnsTotal)}</td>
                          <td style={{ padding: "11px 14px", fontWeight: 700, color: "#1a1a1a" }}>{fmtCurrency(item.finalBalance)}</td>
                          <td style={{ padding: "11px 14px", color: "#888" }}>{item.transactionsCount}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <button onClick={() => { setSelectedArchive(item); setArchiveOpen(true); }} style={{
                              background: C.purple.bg, color: C.purple.text, border: "none",
                              borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                            }}>הצג</button>
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
