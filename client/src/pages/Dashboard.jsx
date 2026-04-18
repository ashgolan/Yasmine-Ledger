import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import * as XLSX from "xlsx";

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
    purple: { bg: "#EEEDFE", border: "#AFA9EC", icon: "#534AB7", text: "#3C3489" },
    red: { bg: "#FCEBEB", border: "#F09595", icon: "#A32D2D", text: "#791F1F" },
    amber: { bg: "#FAEEDA", border: "#EF9F27", icon: "#854F0B", text: "#633806" },
    teal: { bg: "#E1F5EE", border: "#5DCAA5", icon: "#0F6E56", text: "#085041" },
    blue: { bg: "#E6F1FB", border: "#85B7EB", icon: "#185FA5", text: "#0C447C" },
    pink: { bg: "#FBEAF0", border: "#ED93B1", icon: "#993556", text: "#72243E" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTransactionType(type) {
    if (type === "debt") return { label: "חוב", prefix: "+", color: C.red.text, badge: C.red };
    if (type === "payment") return { label: "תשלום", prefix: "−", color: C.teal.text, badge: C.teal };
    if (type === "return") return { label: "החזרה", prefix: "−", color: C.amber.text, badge: C.amber };
    return { label: type, prefix: "", color: "#333", badge: C.purple };
}

function initials(name = "") {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("");
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
    wallet: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5 4V3.5a3 3 0 016 0V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="11" cy="8.5" r="1" fill="currentColor" /></svg>,
    people: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M1 14c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M11 7c1.5 0 4 .8 4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
    archive: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M2 6l2-3h8l2 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M6 9.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
    receipt: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M4 10l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    plus: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
    doc: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M6 6h4M6 9h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
    bookmark: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 2h10v12l-5-3-5 3V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>,
    settings: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
    clock: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" /><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    warn: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 13L8 3l5 10H3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M8 9V7M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, barPct }) {
    return (
        <div style={{
            background: "#fff", border: "0.5px solid #e8e8e8",
            borderRadius: 14, padding: "16px 18px",
            display: "flex", flexDirection: "column", gap: 8,
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>{label}</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: color.bg, color: color.icon, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: color.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{sub}</div>
            <div style={{ height: 3, borderRadius: 2, background: color.bg, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, height: "100%", width: `${barPct}%`, background: color.icon, borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
        </div>
    );
}

function ActionCard({ label, desc, icon, color, onClick }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: "#fff",
                border: `0.5px solid ${hov ? color.border : "#e8e8e8"}`,
                borderRadius: 14, padding: "14px 16px",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12,
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: hov ? `0 0 0 3px ${color.bg}` : "none",
                touchAction: "manipulation",
            }}
        >
            <div style={{ width: 36, height: 36, borderRadius: 9, background: color.bg, color: color.icon, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{desc}</div>
            </div>
        </div>
    );
}

function Badge({ label, color }) {
    return (
        <span style={{ display: "inline-block", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: color.bg, color: color.text, marginTop: 3 }}>
            {label}
        </span>
    );
}

function Avatar({ name }) {
    return (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EEEDFE", color: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            {initials(name)}
        </div>
    );
}

function SectionHeader({ icon, title, color }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: "0.5px solid #f0f0f0" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: color.bg, color: color.icon, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {icon}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{title}</span>
        </div>
    );
}

function EmptyState({ title, subtitle }) {
    return (
        <div style={{ padding: "32px 0", textAlign: "center", color: "#bbb" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "#ccc" }}>{title}</div>
            <div style={{ fontSize: 12 }}>{subtitle}</div>
        </div>
    );
}

function Skeleton({ w, h, radius = 6 }) {
    return (
        <div style={{ width: w, height: h, borderRadius: radius, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
    );
}
// أضف في أعلى Dashboard.jsx


// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDebt: 0, customersInDebtCount: 0,
        archivedAccountsCount: 0, todayTransactionsCount: 0,
        latestTransactions: [], topDebtors: [],
    });
    const [exportModal, setExportModal] = useState(false);

    const [error, setError] = useState("");
    const [exportLoading, setExportLoading] = useState(false);
    // ── دالة Export ──
    // ── في أعلى الملف مع باقي الـ states ──
    const [backupReminderVisible, setBackupReminderVisible] = useState(false);

    useEffect(() => {
        const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        const lastLogin = Number(localStorage.getItem("lastLoginTime") || 0);
        const lastReminder = Number(localStorage.getItem("lastBackupReminder") || 0);
        const now = Date.now();

        // يظهر فقط إذا:
        // 1. تم login جديد (آخر دقيقتين)
        // 2. ولم يظهر التذكير هذا الأسبوع بعد
        const isNewLogin = now - lastLogin < 2 * 60 * 1000;
        const isWeekPassed = now - lastReminder >= WEEK_MS;

        if (isNewLogin && isWeekPassed) {
            const timer = setTimeout(() => {
                setBackupReminderVisible(true);
                localStorage.setItem("lastBackupReminder", String(now));
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    // ── دالة التحميل من المودال ──
    const handleBackupFromReminder = async () => {
        setBackupReminderVisible(false);
        await handleExportJson();
    };
    // ── دوال التصدير ──
    const handleExportExcel = async () => {
        try {
            setExportLoading(true);
            setExportModal(false);
            const res = await api.get("/dashboard/export-customers", { responseType: "blob" });
            const date = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `לקוחות_${date}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export Excel error:", err);
        } finally {
            setExportLoading(false);
        }
    };

    const handleExportJson = async () => {
        try {
            setExportLoading(true);
            setExportModal(false);
            const res = await api.get("/dashboard/export-customers-json", { responseType: "blob" });
            const date = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/zip" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `גיבוי_מלא_${date}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            // ← سجّل وقت آخر backup
            localStorage.setItem("lastManualBackup", String(Date.now()));

        } catch (err) {
            console.error("Export JSON error:", err);
        } finally {
            setExportLoading(false);
        }
    };

    const handleExportBoth = async () => {
        setExportModal(false);
        setExportLoading(true);
        try {
            // تحميل الاثنين بالتوازي
            const [excelRes, jsonRes] = await Promise.all([
                api.get("/dashboard/export-customers", { responseType: "blob" }),
                api.get("/dashboard/export-customers-json", { responseType: "blob" }),
            ]);

            const date = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");

            // Excel
            const excelUrl = window.URL.createObjectURL(
                new Blob([excelRes.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
            );
            const excelLink = document.createElement("a");
            excelLink.href = excelUrl;
            excelLink.setAttribute("download", `לקוחות_${date}.xlsx`);
            document.body.appendChild(excelLink);
            excelLink.click();
            excelLink.remove();
            window.URL.revokeObjectURL(excelUrl);

            // ZIP
            const zipUrl = window.URL.createObjectURL(
                new Blob([jsonRes.data], { type: "application/zip" })
            );
            const zipLink = document.createElement("a");
            zipLink.href = zipUrl;
            zipLink.setAttribute("download", `גיבוי_מלא_${date}.zip`);
            document.body.appendChild(zipLink);
            zipLink.click();
            zipLink.remove();
            window.URL.revokeObjectURL(zipUrl);

        } catch (err) {
            console.error("Export Both error:", err);
        } finally {
            setExportLoading(false);
        }
    };
    useEffect(() => {
        (async () => {
            try {
                setLoading(true); setError("");
                const res = await api.get("/dashboard/stats");
                setStats({
                    totalDebt: Number(res.data?.totalDebt || 0),
                    customersInDebtCount: Number(res.data?.customersInDebtCount || 0),
                    archivedAccountsCount: Number(res.data?.archivedAccountsCount || 0),
                    todayTransactionsCount: Number(res.data?.todayTransactionsCount || 0),
                    latestTransactions: Array.isArray(res.data?.latestTransactions) ? res.data.latestTransactions : [],
                    topDebtors: Array.isArray(res.data?.topDebtors) ? res.data.topDebtors : [],
                });
            } catch (err) {
                setError(err.response?.data?.message || "שגיאה בטעינת לוח הבקרה");
            } finally { setLoading(false); }
        })();
    }, []);

    return (
        <div style={{
            direction: "rtl", minHeight: "100vh", background: "#F5F6FA",
            padding: "16px", boxSizing: "border-box",
            fontFamily: "'Segoe UI', 'Arial Hebrew', Arial, sans-serif",
        }}>
            <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        /* ── Actions grid ── */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        /* ── Bottom grid ── */
        .bottom-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 12px;
        }

        /* ── Tablet ── */
        @media (max-width: 900px) {
          .stats-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .actions-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bottom-grid  { grid-template-columns: 1fr !important; }
        }

        /* ── Mobile ── */
        @media (max-width: 540px) {
          .stats-grid   { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .actions-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .bottom-grid  { grid-template-columns: 1fr !important; gap: 8px !important; }
          .dash-header  { padding: 16px !important; }
          .dash-header-btns { flex-wrap: wrap !important; }
          .dash-page    { padding: 12px !important; }
        }
      `}</style>

            <div className="dash-page" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>

                {/* ── Header ── */}
                <div className="dash-header" style={{
                    background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14,
                    padding: "20px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 12,
                }}>
                    <div>
                        <div style={{ fontSize: 11, color: "#bbb", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                            מערכת ניהול חשבונות
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>לוח בקרה</div>
                        <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>סקירה כללית של חובות, תנועות ולקוחות</div>
                    </div>
                    <div className="dash-header-btns" style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => navigate("/customers")} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "#534AB7", color: "#fff", border: "none",
                            borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600,
                            cursor: "pointer", touchAction: "manipulation", whiteSpace: "nowrap",
                        }}>
                            {Icon.plus} לקוח חדש
                        </button>
                        <button onClick={() => navigate("/quotes")} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "#fff", color: "#444", border: "0.5px solid #ddd",
                            borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600,
                            cursor: "pointer", touchAction: "manipulation", whiteSpace: "nowrap",
                        }}>
                            {Icon.doc} הצעת מחיר
                        </button>
                        {/* زر التصدير */}
                        <button
                            onClick={() => setExportModal(true)}
                            disabled={exportLoading}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: "#0F6E56", color: "#E1F5EE", border: "none",
                                borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600,
                                cursor: exportLoading ? "not-allowed" : "pointer",
                                opacity: exportLoading ? 0.7 : 1,
                                touchAction: "manipulation", whiteSpace: "nowrap",
                            }}
                        >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                            {exportLoading ? "מייצא..." : "ייצוא"}
                        </button>

                        {/* Modal اختيار نوع التصدير */}
                        {exportModal && (
                            <div
                                onClick={() => setExportModal(false)}
                                style={{
                                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
                                    zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        background: "#fff", borderRadius: 16, padding: "28px 24px",
                                        width: 320, direction: "rtl", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
                                        display: "flex", flexDirection: "column", gap: 12,
                                    }}
                                >
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                                        בחר פורמט ייצוא
                                    </div>
                                    <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
                                        כיצד תרצה לייצא את נתוני הלקוחות?
                                    </div>

                                    {/* Excel */}
                                    <button
                                        onClick={handleExportExcel}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            background: "#E1F5EE", border: "1px solid #5DCAA5",
                                            borderRadius: 10, padding: "12px 16px", cursor: "pointer", textAlign: "right",
                                        }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
                                                <path d="M14 2v6h6M8 13l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#085041" }}>ייצוא Excel</div>
                                            <div style={{ fontSize: 11, color: "#5DCAA5", marginTop: 2 }}>קובץ .xlsx מעוצב עם גיליונות</div>
                                        </div>
                                    </button>

                                    {/* JSON */}
                                    <button
                                        onClick={handleExportJson}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            background: "#EEEDFE", border: "1px solid #AFA9EC",
                                            borderRadius: 10, padding: "12px 16px", cursor: "pointer", textAlign: "right",
                                        }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <path d="M8 3H7a2 2 0 00-2 2v3c0 1.1-.9 2-2 2s2 .9 2 2v3a2 2 0 002 2h1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                                                <path d="M16 3h1a2 2 0 012 2v3c0 1.1.9 2 2 2s-2 .9-2 2v3a2 2 0 01-2 2h-1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#3C3489" }}>ייצוא JSON</div>
                                            <div style={{ fontSize: 11, color: "#AFA9EC", marginTop: 2 }}>גיבוי מלא — מתאים לייבוא ל-DB</div>
                                        </div>
                                    </button>

                                    {/* الاثنين معاً */}
                                    <button
                                        onClick={handleExportBoth}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            background: "#FAEEDA", border: "1px solid #EF9F27",
                                            borderRadius: 10, padding: "12px 16px", cursor: "pointer", textAlign: "right",
                                        }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#854F0B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2v10M9 9l3 3 3-3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#633806" }}>ייצוא הכל</div>
                                            <div style={{ fontSize: 11, color: "#EF9F27", marginTop: 2 }}>הורדת Excel + JSON יחד</div>
                                        </div>
                                    </button>

                                    {/* إلغاء */}
                                    <button
                                        onClick={() => setExportModal(false)}
                                        style={{
                                            marginTop: 4, background: "none", border: "none",
                                            color: "#aaa", fontSize: 13, cursor: "pointer", padding: "6px 0",
                                        }}
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div style={{ background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                {/* ── Stat cards ── */}
                {loading ? (
                    <div className="stats-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: 18 }}>
                                <Skeleton w="40%" h={14} />
                                <div style={{ marginTop: 12 }}><Skeleton w="70%" h={26} /></div>
                                <div style={{ marginTop: 8 }}><Skeleton w="55%" h={11} /></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="stats-grid">
                        <StatCard label="סך כל החובות" value={`₪ ${Number(stats.totalDebt).toLocaleString("he-IL")}`} sub="יתרת חוב פתוחה" icon={Icon.wallet} color={C.red} barPct={72} />
                        <StatCard label="לקוחות עם חוב" value={Number(stats.customersInDebtCount).toLocaleString("he-IL")} sub="חשבונות פתוחים" icon={Icon.people} color={C.purple} barPct={58} />
                        <StatCard label="חשבונות בארכיון" value={Number(stats.archivedAccountsCount).toLocaleString("he-IL")} sub="הועברו לארכיון" icon={Icon.archive} color={C.amber} barPct={30} />
                        <StatCard label="תנועות היום" value={Number(stats.todayTransactionsCount).toLocaleString("he-IL")} sub="נרשמו היום" icon={Icon.receipt} color={C.teal} barPct={45} />
                    </div>
                )}

                {/* ── Quick actions ── */}
                <div className="actions-grid">
                    <ActionCard label="ניהול לקוחות" desc="צפייה והוספה" icon={Icon.people} color={C.purple} onClick={() => navigate("/customers")} />
                    <ActionCard label="פריטים" desc="ניהול וחיפוש" icon={Icon.doc} color={C.blue} onClick={() => navigate("/items")} />
                    <ActionCard label="הצעות מחיר" desc="יצירה וניהול" icon={Icon.bookmark} color={C.pink} onClick={() => navigate("/quotes")} />
                    <ActionCard label="הגדרות" desc="פרטי העסק" icon={Icon.settings} color={C.amber} onClick={() => navigate("/settings")} />
                </div>

                {/* ── Bottom sections ── */}
                {loading ? (
                    <div className="bottom-grid">
                        {[6, 5].map((lines, i) => (
                            <div key={i} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: 20 }}>
                                <Skeleton w="35%" h={18} />
                                {Array.from({ length: lines }).map((_, j) => (
                                    <div key={j} style={{ marginTop: 18 }}>
                                        <Skeleton w="55%" h={14} />
                                        <div style={{ marginTop: 6 }}><Skeleton w="35%" h={11} /></div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bottom-grid">

                        {/* Latest transactions */}
                        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
                            <SectionHeader icon={Icon.clock} title="תנועות אחרונות" color={C.purple} />
                            {stats.latestTransactions.length === 0 ? (
                                <EmptyState title="אין עדיין תנועות" subtitle="כאשר יתווספו חובות, תשלומים או החזרות, הן יופיעו כאן." />
                            ) : (
                                stats.latestTransactions.map((tx, i) => {
                                    const { label, prefix, color, badge } = getTransactionType(tx.type);
                                    return (
                                        <div key={tx._id || i}>
                                            <div
                                                onClick={() => tx.customerId && navigate(`/account/${tx.customerId}`)}
                                                style={{
                                                    display: "flex", alignItems: "center",
                                                    justifyContent: "space-between",
                                                    padding: "12px 0", gap: 10,
                                                    cursor: tx.customerId ? "pointer" : "default",
                                                    touchAction: "manipulation",
                                                }}
                                            >
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.customerName}</div>
                                                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {tx.date ? new Date(tx.date).toLocaleString("he-IL") : ""}
                                                        {tx.description ? ` · ${tx.description}` : ""}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "left", flexShrink: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color }}>{prefix}₪ {Number(tx.amount || 0).toLocaleString("he-IL")}</div>
                                                    <Badge label={label} color={badge} />
                                                </div>
                                            </div>
                                            {i !== stats.latestTransactions.length - 1 && <div style={{ borderBottom: "0.5px solid #f0f0f0" }} />}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Top debtors */}
                        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
                            <SectionHeader icon={Icon.warn} title="החייבים הגדולים ביותר" color={C.red} />
                            {stats.topDebtors.length === 0 ? (
                                <EmptyState title="אין כרגע חובות פתוחים" subtitle="כאשר יהיו חשבונות פתוחים, הם יופיעו כאן." />
                            ) : (
                                stats.topDebtors.map((c, i) => (
                                    <div key={c._id || i}>
                                        <div
                                            onClick={() => c.customerId && navigate(`/account/${c.customerId}`)}
                                            style={{
                                                display: "flex", alignItems: "center",
                                                gap: 10, padding: "11px 0",
                                                cursor: c.customerId ? "pointer" : "default",
                                                touchAction: "manipulation",
                                            }}
                                        >
                                            <span style={{ fontSize: 10, color: "#ccc", width: 14, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                                            <Avatar name={c.name} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {c.name}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: C.red.text, flexShrink: 0 }}>
                                                ₪ {Number(c.balance || 0).toLocaleString("he-IL")}
                                            </div>
                                        </div>
                                        {i !== stats.topDebtors.length - 1 && <div style={{ borderBottom: "0.5px solid #f0f0f0" }} />}
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                )}
            </div>
            {/* ── مودال تذكير الـ Backup ── */}
            {backupReminderVisible && (
                <div
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,0.4)",
                        zIndex: 2000,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            background: "#fff", borderRadius: 18,
                            padding: "28px 24px", width: 340,
                            direction: "rtl", boxShadow: "0 12px 50px rgba(0,0,0,0.2)",
                            display: "flex", flexDirection: "column", gap: 14,
                        }}
                    >
                        {/* أيقونة */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                background: "#EEEDFE", display: "flex",
                                alignItems: "center", justifyContent: "center",
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2v10M9 9l3 3 3-3" stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round" />
                                    <circle cx="12" cy="12" r="10" stroke="#AFA9EC" strokeWidth="1.2" strokeDasharray="3 3" />
                                </svg>
                            </div>
                        </div>

                        {/* نص */}
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>
                                תזכורת גיבוי שבועית
                            </div>
                            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
                                עברה שבוע מאז הגיבוי האחרון.
                                <br />
                                מומלץ לשמור עותק מעודכן של הנתונים שלך.
                            </div>
                        </div>

                        {/* آخر backup */}
                        <div style={{
                            background: "#F5F6FA", borderRadius: 10,
                            padding: "10px 14px", textAlign: "center",
                            fontSize: 12, color: "#aaa",
                        }}>
                            גיבוי אחרון: {(() => {
                                const last = localStorage.getItem("lastManualBackup");
                                if (!last) return "לא בוצע עדיין";
                                return new Date(Number(last)).toLocaleDateString("he-IL", {
                                    day: "2-digit", month: "2-digit", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                });
                            })()}
                        </div>

                        {/* أزرار */}
                        <button
                            onClick={handleBackupFromReminder}
                            style={{
                                background: "#534AB7", color: "#fff", border: "none",
                                borderRadius: 10, padding: "12px 0", fontSize: 14,
                                fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v10M9 9l3 3 3-3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            גבה עכשיו
                        </button>

                        <button
                            onClick={() => setBackupReminderVisible(false)}
                            style={{
                                background: "none", border: "0.5px solid #e8e8e8",
                                borderRadius: 10, padding: "10px 0", fontSize: 13,
                                color: "#aaa", cursor: "pointer", fontWeight: 500,
                            }}
                        >
                            תזכיר לי מאוחר יותר
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
