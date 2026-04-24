import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios";

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
    // ── ADDED: barcode & scan icons ──
    barcode: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="2" height="10" fill="currentColor" rx="0.5"/><rect x="4" y="3" width="1" height="10" fill="currentColor" rx="0.5"/><rect x="6" y="3" width="2" height="10" fill="currentColor" rx="0.5"/><rect x="9" y="3" width="1" height="10" fill="currentColor" rx="0.5"/><rect x="11" y="3" width="2" height="10" fill="currentColor" rx="0.5"/><rect x="14" y="3" width="1" height="10" fill="currentColor" rx="0.5"/></svg>,
    scan: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 5V2h3M12 2h3v3M1 11v3h3M12 14h3v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M1 8h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
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

// ── Edit Customer Modal ──
function EditCustomerModal({ open, onClose, customer, onSaved }) {
    const [form, setForm] = useState({ fullName: "", phone: "", idNumber: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && customer) { setForm({ fullName: customer.fullName || "", phone: customer.phone || "", idNumber: customer.idNumber || "" }); setError(""); }
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
                            <div style={{ position: "absolute", top: "50%", right: 11, transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }}>{Icon.person}</div>
                            <input autoFocus value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="ישראל ישראלי" style={{ ...inputStyle, paddingRight: 36 }} />
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
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 7h4M8 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
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
                        {[
                            ["🧾", "עסקאות בחשבון הנוכחי", stats?.transactions],
                            ["📦", "חשבונות בארכיון", stats?.archivedAccounts],
                            ["📋", "הצעות מחיר", stats?.quotes],
                            ["🚚", "תעודות משלוח", stats?.deliveryNotes],
                        ].map(([emoji, label, val]) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 15 }}>{emoji}</span> {label}
                                </span>
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

    // ── Batch form ──
    const today = new Date().toISOString().slice(0, 10);
    const [batchType, setBatchType] = useState("debt");
    const [batchDate, setBatchDate] = useState(today);
    const [batchRows, setBatchRows] = useState([newRow()]);
    const batchTotal = batchRows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const validCount = batchRows.filter(r => Number(r.amount || 0) > 0).length;

    // ── ADDED: Barcode scan state ──
    const [scanMode, setScanMode] = useState(false);       // האם ממתינים לסריקה
    const [scanToast, setScanToast] = useState(null);      // { found, name, price, code }
    const scanBuffer = useRef("");
    const scanTimer = useRef(null);
    const scanToastTimer = useRef(null);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 700);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

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
        } finally { setLoading(false); }
    };

    useEffect(() => { if (customerId) fetchData(); }, [customerId]);

    // ── ADDED: Global barcode listener ──
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
                    // מלא את השורה הראשונה הריקה, או הוסף שורה חדשה
                    setBatchRows(prev => {
                        const emptyIdx = prev.findIndex(r => !r.description);
                        const qty = Number(prev[emptyIdx >= 0 ? emptyIdx : 0].quantity || 1);
                        const amt = qty && match.price ? qty * match.price : match.price || 0;
                        const updated = { ...prev[emptyIdx >= 0 ? emptyIdx : 0], description: match.name, unitPrice: String(match.price || ""), amount: String(amt), item: match._id };
                        if (emptyIdx >= 0) {
                            const next = [...prev];
                            next[emptyIdx] = updated;
                            return next;
                        }
                        return [...prev, { ...newRow(), ...updated }];
                    });
                    setScanToast({ found: true, name: match.name, price: match.price, code });
                } else {
                    setScanToast({ found: false, code });
                }
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

    // ── Batch row helpers ──
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

    // ── Add all ──
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
                    type: batchType, date: batchDate,
                    description: row.description,
                    quantity: Number(row.quantity || 0),
                    unitPrice: Number(row.unitPrice || 0),
                    amount: Number(row.amount),
                    note: sharedNote,
                    item: row.item || null,
                });
            }
            resetBatch();
            await fetchData();
            if (lastRes?.data?.shouldAskArchive) setShowArchivePrompt(true);
        } catch (err) {
            setError(err.response?.data?.message || "שגיאה בהוספת עסקאות");
        } finally { setAdding(false); }
    };

    // ── Edit transaction ──
    const startEdit = (t) => {
        setEditingId(t._id);
        setEditForm({ date: t.date ? new Date(t.date).toISOString().slice(0, 10) : "", type: t.type, description: t.description || "", quantity: t.quantity ?? "", unitPrice: t.unitPrice ?? "", amount: t.amount ?? "", note: t.note || "" });
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
        try { await api.delete(`/transactions/${id}`); await fetchData(); }
        catch (err) { setError(err.response?.data?.message || "שגיאה במחיקה"); }
    };

    // ── Archive ──
    const handleArchive = async () => {
        try {
            setArchiving(true);
            const accountId = data?.account?._id;
            if (!accountId) { setError("לא נמצא מזהה חשבון"); return; }
            await api.post(`/accounts/archive/${accountId}`);
            setShowArchivePrompt(false); setTab(1);
            await fetchData();
        } catch (err) { setError(err.response?.data?.message || "שגיאה בארכוב החשבון"); }
        finally { setArchiving(false); }
    };

    // ── Delete modal ──
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

    // ── Print (current account) ──
    const handlePrint = () => {
        if (!data) return;
        const { transactions, balance } = data;
        const customerName = data?.account?.customer?.fullName || "לקוח";
        const customerPhone = data?.account?.customer?.phone || "";
        const debtsTotal = transactions.filter(t => t.type === "debt").reduce((s, t) => s + Number(t.amount || 0), 0);
        const paymentsTotal = transactions.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
        const returnsTotal = transactions.filter(t => t.type === "return").reduce((s, t) => s + Number(t.amount || 0), 0);
        const rows = transactions.map(t => `
  <tr>
    <td>${fmtDate(t.date)}</td>
    <td>${getTypeInfo(t.type).label}</td>
    <td>${t.description || "—"}</td>
    <td>${t.type === "payment" ? "—" : t.quantity || "—"}</td>
    <td>${t.type === "payment" ? "—" : t.unitPrice || "—"}</td>
    <td>${Number(t.amount || 0).toLocaleString("he-IL")} ₪</td>
    <td class="note-cell">${t.note ? `📝 ${t.note}` : "—"}</td>
  </tr>
`).join("");
        const logoBanner = settings?.logoBase64
            ? `<div class="logo-banner"><img src="${settings.logoBase64}" style="max-height:90px;max-width:100%;object-fit:contain"/></div>`
            : `<div class="logo-banner logo-text">${settings?.storeName || ""}</div>`;
        const storeInfo = [
            settings?.storePhone ? `טלפון: ${settings.storePhone}` : "",
            settings?.storeAddress || "",
        ].filter(Boolean).join(" · ");
        const w = window.open("", "_blank", "width=1000,height=800");
        if (!w) return;
        w.document.write(`<html dir="rtl"><head><title>חשבון לקוח — ${customerName}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;direction:rtl;color:#111;background:#fff}
.logo-banner{width:100%;background:#f8f8f8;border-bottom:2px solid #eee;display:flex;align-items:center;justify-content:center;padding:18px 32px;min-height:80px}
.logo-text{font-size:26px;font-weight:800;color:#1a1a1a;letter-spacing:-0.5px}
.store-info{text-align:center;font-size:12px;color:#888;padding:7px 32px 0;border-bottom:1px solid #f0f0f0;padding-bottom:10px}
.details{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 32px;border-bottom:1px solid #eee;font-size:12px;color:#555;line-height:1.9}
.details strong{color:#111;font-size:13px}
.details-right{text-align:right}
.details-left{text-align:left;color:#666}
.content{padding:0 32px 32px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{border:1px solid #ddd;padding:9px 11px;text-align:right;font-size:13px}
th{background:#f5f5f5;font-weight:700;color:#444}
.note-cell{font-size:11px;color:#777;max-width:160px;word-break:break-word}
tr:nth-child(even){background:#fafafa}
.summary{margin-top:20px;border:1px solid #eee;border-radius:8px;overflow:hidden}
.summary-row{display:flex;justify-content:space-between;padding:9px 16px;font-size:13px;border-bottom:1px solid #f0f0f0}
.summary-row:last-child{border-bottom:none}
.summary-row.total{background:#f5f5f5;font-size:16px;font-weight:800}
.debt-color{color:#A32D2D}.pay-color{color:#0F6E56}.bal-color{color:#534AB7}
.footer{margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center}
@media print{body{}}
</style></head><body>
${logoBanner}
${storeInfo ? `<div class="store-info">${storeInfo}</div>` : ""}
<div class="details">
  <div class="details-right">
    <div>לקוח: <strong>${customerName}</strong></div>
    ${customerPhone ? `<div>טלפון: <strong>${customerPhone}</strong></div>` : ""}
    ${customer?.idNumber ? `<div>ת.ז.: <strong>${customer.idNumber}</strong></div>` : ""}
  </div>
  <div class="details-left">
    <div>תאריך הדפסה: <strong>${fmtDate(new Date())}</strong></div>
  </div>
</div>
<div class="content">
<table><thead><tr><th>תאריך</th><th>סוג</th><th>תיאור</th><th>כמות</th><th>מחיר</th><th>סכום</th><th>הערה</th></tr></thead><tbody>${rows}</tbody></table>
<div class="summary">
  <div class="summary-row"><span>סה״כ חובות</span><span class="debt-color">${debtsTotal.toLocaleString("he-IL")} ₪</span></div>
  <div class="summary-row"><span>סה״כ תשלומים</span><span class="pay-color">${paymentsTotal.toLocaleString("he-IL")} ₪</span></div>
  <div class="summary-row"><span>סה״כ החזרות</span><span class="pay-color">${returnsTotal.toLocaleString("he-IL")} ₪</span></div>
  <div class="summary-row total"><span>יתרת חוב</span><span class="bal-color">${Number(balance || 0).toLocaleString("he-IL")} ₪</span></div>
</div>
${settings?.footerText ? `<div class="footer">${settings.footerText}</div>` : ""}
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`);
        w.document.close();
    };

    // ── Print Archive ──
    const handlePrintArchive = async (item) => {
        const customerName = data?.account?.customer?.fullName || "לקוח";
        const customerPhone = data?.account?.customer?.phone || "";
        let transactions = item.transactions;
        if (!transactions) {
            try {
                const res = await api.get(`/accounts/archived/${item.account._id}`);
                transactions = res.data.transactions;
            } catch {
                setError("שגיאה בטעינת פרטי הארכיון לצורך הדפסה");
                return;
            }
        }
        const debtsTotal = transactions.filter(t => t.type === "debt").reduce((s, t) => s + Number(t.amount || 0), 0);
        const paymentsTotal = transactions.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
        const returnsTotal = transactions.filter(t => t.type === "return").reduce((s, t) => s + Number(t.amount || 0), 0);
        const rows = transactions.map(t => `
  <tr>
    <td>${fmtDate(t.date)}</td>
    <td>${getTypeInfo(t.type).label}</td>
    <td>${t.description || "—"}</td>
    <td>${t.type === "payment" ? "—" : t.quantity || "—"}</td>
    <td>${t.type === "payment" ? "—" : t.unitPrice || "—"}</td>
    <td>${Number(t.amount || 0).toLocaleString("he-IL")} ₪</td>
    <td class="note-cell">${t.note ? `📝 ${t.note}` : "—"}</td>
  </tr>
`).join("");
        const logoBanner = settings?.logoBase64
            ? `<div class="logo-banner"><img src="${settings.logoBase64}" style="max-height:90px;max-width:100%;object-fit:contain"/></div>`
            : `<div class="logo-banner logo-text">${settings?.storeName || ""}</div>`;
        const storeInfo = [
            settings?.storePhone ? `טלפון: ${settings.storePhone}` : "",
            settings?.storeAddress || "",
        ].filter(Boolean).join(" · ");
        const w = window.open("", "_blank", "width=1000,height=800");
        if (!w) return;
        w.document.write(`<html dir="rtl"><head><title>ארכיון — ${customerName}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;direction:rtl;color:#111;background:#fff}
.logo-banner{width:100%;background:#f8f8f8;border-bottom:2px solid #eee;display:flex;align-items:center;justify-content:center;padding:18px 32px;min-height:80px}
.logo-text{font-size:26px;font-weight:800;color:#1a1a1a;letter-spacing:-0.5px}
.store-info{text-align:center;font-size:12px;color:#888;padding:7px 32px 10px;border-bottom:1px solid #f0f0f0}
.details{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 32px;border-bottom:1px solid #eee;font-size:12px;color:#555;line-height:1.9}
.details strong{color:#111;font-size:13px}
.details-right{text-align:right}
.details-left{text-align:left;color:#666}
.archive-badge{display:inline-block;background:#EEEDFE;color:#3C3489;border:1px solid #AFA9EC;border-radius:20px;padding:2px 12px;font-size:11px;font-weight:700;margin-bottom:6px}
.content{padding:0 32px 32px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{border:1px solid #ddd;padding:9px 11px;text-align:right;font-size:13px}
th{background:#f5f5f5;font-weight:700;color:#444}
.note-cell{font-size:11px;color:#777;max-width:160px;word-break:break-word}
tr:nth-child(even){background:#fafafa}
.summary{margin-top:20px;border:1px solid #eee;border-radius:8px;overflow:hidden}
.summary-row{display:flex;justify-content:space-between;padding:9px 16px;font-size:13px;border-bottom:1px solid #f0f0f0}
.summary-row:last-child{border-bottom:none}
.summary-row.total{background:#f5f5f5;font-size:16px;font-weight:800}
.debt-color{color:#A32D2D}.pay-color{color:#0F6E56}.bal-color{color:#534AB7}
.footer{margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center}
</style></head><body>
${logoBanner}
${storeInfo ? `<div class="store-info">${storeInfo}</div>` : ""}
<div class="details">
  <div class="details-right">
    <div class="archive-badge">📦 חשבון מאורכב</div>
    <div>לקוח: <strong>${customerName}</strong></div>
    ${customerPhone ? `<div>טלפון: <strong>${customerPhone}</strong></div>` : ""}
    ${data?.account?.customer?.idNumber ? `<div>ת.ז.: <strong>${data.account.customer.idNumber}</strong></div>` : ""}
  </div>
  <div class="details-left">
    <div>תאריך הדפסה: <strong>${fmtDate(new Date())}</strong></div>
    <div>פתיחה: <strong>${fmtDate(item.account.openedAt)}</strong></div>
    <div>ארכוב: <strong>${fmtDate(item.account.archivedAt)}</strong></div>
  </div>
</div>
<div class="content">
<table><thead><tr><th>תאריך</th><th>סוג</th><th>תיאור</th><th>כמות</th><th>מחיר</th><th>סכום</th><th>הערה</th></tr></thead><tbody>${rows}</tbody></table>
<div class="summary">
  <div class="summary-row"><span>סה״כ חובות</span><span class="debt-color">${debtsTotal.toLocaleString("he-IL")} ₪</span></div>
  <div class="summary-row"><span>סה״כ תשלומים</span><span class="pay-color">${paymentsTotal.toLocaleString("he-IL")} ₪</span></div>
  <div class="summary-row"><span>סה״כ החזרות</span><span class="pay-color">${returnsTotal.toLocaleString("he-IL")} ₪</span></div>
  <div class="summary-row total"><span>מאזן סופי</span><span class="bal-color">${Number(item.finalBalance || 0).toLocaleString("he-IL")} ₪</span></div>
</div>
${settings?.footerText ? `<div class="footer">${settings.footerText}</div>` : ""}
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`);
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
        .tx-row:hover { background:#fafafe !important; }
        .tx-row:hover .row-actions { opacity:1 !important; }
        .batch-row:hover .row-del { opacity:1 !important; }
        input:focus, select:focus { border-color:#AFA9EC !important; box-shadow:0 0 0 3px #EEEDFE !important; }
        .tab-btn { border:none;background:none;cursor:pointer;padding:10px 14px;font-size:13px;font-weight:600;color:#aaa;border-bottom:2px solid transparent;transition:all 0.15s;font-family:inherit;white-space:nowrap; }
        .tab-btn.active { color:#534AB7;border-bottom-color:#534AB7; }
        .icon-btn { border:none;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;font-family:inherit; }
        .note-wrap:hover .note-tooltip { opacity:1 !important; }
        .tx-table-wrap { overflow-x:auto;-webkit-overflow-scrolling:touch; }
        .arch-table-wrap { overflow-x:auto;-webkit-overflow-scrolling:touch; }
        .batch-table-wrap { overflow-x:auto;-webkit-overflow-scrolling:touch; }
        .cust-action-btn:hover { opacity:0.85; }
        .row-del { opacity:0;transition:opacity 0.15s; }
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

            <EditCustomerModal open={editCustomerOpen} onClose={() => setEditCustomerOpen(false)} customer={customer} onSaved={fetchData} />
            <DeleteCustomerModal open={deleteCustomerOpen} onClose={() => setDeleteCustomerOpen(false)} customer={customer} stats={deleteStats} onDeleted={() => navigate("/customers")} />

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
                                        {customer?.phone && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, color: "#aaa", fontSize: 12 }}>
                                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5L6 7a7.9 7.9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                                                <span>{customer.phone}</span>
                                            </div>
                                        )}
                                        {customer?.idNumber && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, color: "#bbb", fontSize: 11 }}>
                                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 7h4M8 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                                <span style={{ fontFamily: "monospace" }}>{customer.idNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <button className="cust-action-btn" onClick={() => setEditCustomerOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: 120, background: C.blue.bg, border: `0.5px solid ${C.blue.border}`, borderRadius: 9, padding: "8px 0", fontSize: 13, fontWeight: 600, color: C.blue.text, cursor: "pointer", touchAction: "manipulation", transition: "opacity 0.15s" }}>
                            {Icon.edit} ערוך פרטים
                        </button>
                        <button className="cust-action-btn" onClick={openDeleteModal} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: 120, background: C.red.bg, border: `0.5px solid ${C.red.border}`, borderRadius: 9, padding: "8px 0", fontSize: 13, fontWeight: 600, color: C.red.text, cursor: "pointer", touchAction: "manipulation", transition: "opacity 0.15s" }}>
                            {Icon.trash} מחק לקוח
                        </button>
                        <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: 120, background: "#fff", border: "0.5px solid #ddd", borderRadius: 9, padding: "8px 0", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer", touchAction: "manipulation" }}>
                            {Icon.print} הדפס
                        </button>
                    </div>
                </div>

                {error && <div style={{ background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{error}</div>}

                {/* ── ADDED: Scan Toast ── */}
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

                {/* ── ADDED: Scan Mode Banner ── */}
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
                                                <div className="balance-amount" style={{ fontSize: 28, fontWeight: 800, color: card.numColor, lineHeight: 1 }}>{fmtCurrency(balance)}</div>
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

                            {/* ── Batch Add Form ── */}
                            <div className="form-wrap" style={{ background: "#FAFBFF", border: "0.5px solid #E8E8F0", borderRadius: 12, padding: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 3, height: 16, background: "#534AB7", borderRadius: 99 }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: "0.05em", textTransform: "uppercase" }}>הוסף עסקאות</span>
                                    </div>
                                    {/* ── ADDED: Scan button in form header ── */}
                                    {batchType !== "payment" && (
                                        <button
                                            onClick={() => setScanMode(s => !s)}
                                            title={scanMode ? "ביטול סריקה" : "סרוק ברקוד"}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 6,
                                                background: scanMode ? C.purple.bg : "#f5f5f5",
                                                color: scanMode ? C.purple.text : "#666",
                                                border: `0.5px solid ${scanMode ? C.purple.border : "#ddd"}`,
                                                borderRadius: 8, padding: "6px 12px",
                                                fontSize: 12, fontWeight: 600, cursor: "pointer",
                                                transition: "all 0.15s", touchAction: "manipulation",
                                            }}
                                        >
                                            {Icon.scan} {scanMode ? "מבטל..." : "סרוק ברקוד"}
                                        </button>
                                    )}
                                </div>

                                {/* שורה עליונה: סוג + תאריך + הערה */}
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
                                        <input
                                            value={batchRows[0]?.sharedNote ?? ""}
                                            onChange={e => setBatchRows(prev => prev.map(r => ({ ...r, sharedNote: e.target.value })))}
                                            placeholder="הערה..."
                                            style={{ ...inputStyle, fontSize: 12, color: "#777" }}
                                        />
                                    </div>
                                </div>

                                {/* שורות */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                                    <datalist id="items-list-batch">{items.map(it => <option key={it._id} value={it.name} />)}</datalist>
                                    {batchRows.map((row, i) => (
                                        <div key={row.id} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                                <input
                                                    list="items-list-batch"
                                                    value={row.description}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const match = items.find(it => it.name === val);
                                                        if (match) updateRow(row.id, { description: val, unitPrice: String(match.price || ""), item: match._id });
                                                        else updateRow(row.id, { description: val, item: null });
                                                    }}
                                                    placeholder={batchType === "payment" ? "אמצעי תשלום..." : "פריט / תיאור..."}
                                                    style={{ ...inputStyle, flex: "3 1 160px", minWidth: 120 }}
                                                />
                                                {batchType !== "payment" && (
                                                    <input type="number" value={row.quantity} onChange={e => updateRow(row.id, { quantity: e.target.value })} placeholder="כמות" style={{ ...inputStyle, flex: "1 1 60px", minWidth: 55, textAlign: "center" }} />
                                                )}
                                                {batchType !== "payment" && (
                                                    <input type="number" value={row.unitPrice} onChange={e => updateRow(row.id, { unitPrice: e.target.value })} placeholder="מחיר" style={{ ...inputStyle, flex: "1 1 70px", minWidth: 65, textAlign: "center" }} />
                                                )}
                                                <input type="number" value={row.amount} onChange={e => updateRow(row.id, { amount: e.target.value })} placeholder="סכום ₪" style={{ ...inputStyle, flex: "1 1 80px", minWidth: 75, fontWeight: 700, textAlign: "center" }} />
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
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                                    <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5f5f5", color: "#555", border: "0.5px solid #ddd", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", touchAction: "manipulation" }}>
                                        {Icon.plus} הוסף שורה
                                    </button>
                                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                        {batchRows.length > 1 && batchTotal > 0 && (
                                            <div style={{ textAlign: "left" }}>
                                                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 500 }}>סה״כ</div>
                                                <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{fmtCurrency(batchTotal)}</div>
                                            </div>
                                        )}
                                        <button onClick={handleAddAll} disabled={adding} style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: adding ? "not-allowed" : "pointer", opacity: adding ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", touchAction: "manipulation" }}>
                                            {Icon.plus} {adding ? "שומר..." : validCount > 1 ? `הוסף הכל (${validCount})` : "הוסף"}
                                        </button>
                                    </div>
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
                                        {transactions.length === 0 && (
                                            <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: 13 }}>אין עסקאות עדיין</td></tr>
                                        )}
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
                                {transactions.length === 0 ? (
                                    <div style={{ padding: "32px 0", textAlign: "center", color: "#ccc", fontSize: 13 }}>אין עסקאות עדיין</div>
                                ) : transactions.map(t => (
                                    <TxCard key={t._id} t={t} onEdit={startEdit} onDelete={handleDelete} />
                                ))}
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
                                                                    setArchiveDetailLoading(item.account._id);
                                                                    setSelectedArchive(item);
                                                                    setArchiveOpen(true);
                                                                    const res = await api.get(`/accounts/archived/${item.account._id}`);
                                                                    setSelectedArchive({ ...item, transactions: res.data.transactions });
                                                                } catch (err) {
                                                                    setError(err.response?.data?.message || "שגיאה בטעינת הארכיון");
                                                                    setArchiveOpen(false);
                                                                } finally { setArchiveDetailLoading(false); }
                                                            }} style={{ background: C.purple.bg, color: C.purple.text, border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                                                                הצג
                                                            </button>
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
