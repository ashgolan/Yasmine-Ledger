import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    back:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    wallet:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 4V3.5a3 3 0 016 0V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="11" cy="8.5" r="1" fill="currentColor"/></svg>,
    people:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 14c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M11 7c1.5 0 4 .8 4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    chart:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 12l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    tag:     <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2h5l7 7-5 5-7-7V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="5" cy="5" r="1" fill="currentColor"/></svg>,
    up:      <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    down:    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    warn:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 13L8 3l5 10H3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 9V7M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    convert: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon, color, change }) {
    return (
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>{label}</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: color.bg, color: color.icon, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: color.text, lineHeight: 1 }}>{value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {change !== null && change !== undefined && (
                    <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 600, color: change >= 0 ? C.red.text : C.teal.text }}>
                        {change >= 0 ? Icon.up : Icon.down}
                        {Math.abs(change)}%
                    </span>
                )}
                {sub && <span style={{ fontSize: 11, color: "#aaa" }}>{sub}</span>}
            </div>
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, color }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 16, background: color.icon, borderRadius: 99 }} />
            <div style={{ width: 26, height: 26, borderRadius: 7, background: color.bg, color: color.icon, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{title}</span>
        </div>
    );
}

// ─── Chart Canvas ─────────────────────────────────────────────────────────────
function MonthlyBarChart({ data }) {
    const canvasRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // load Chart.js dynamically
        if (window.Chart) {
            renderChart(canvas, data);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
        script.onload = () => renderChart(canvas, data);
        document.head.appendChild(script);
    }, [data]);

    return (
        <div style={{ position: "relative", width: "100%", height: 220 }}>
            <canvas ref={canvasRef} role="img" aria-label="רסם בת ניב של חובות ותשלומים לפי חודש" />
        </div>
    );
}

function renderChart(canvas, data) {
    if (!canvas || !window.Chart) return;
    // destroy old chart if exists
    const existing = window.Chart.getChart(canvas);
    if (existing) existing.destroy();

    new window.Chart(canvas, {
        type: "bar",
        data: {
            labels: data.map((m) => m.label),
            datasets: [
                {
                    label: "חובות",
                    data: data.map((m) => Math.round(m.debt)),
                    backgroundColor: "#FCEBEB",
                    borderColor: "#A32D2D",
                    borderWidth: 1.5,
                    borderRadius: 4,
                },
                {
                    label: "תשלומים",
                    data: data.map((m) => Math.round(m.payment + m.return)),
                    backgroundColor: "#E1F5EE",
                    borderColor: "#0F6E56",
                    borderWidth: 1.5,
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ₪${ctx.parsed.y.toLocaleString("he-IL")}`,
                    },
                },
            },
            scales: {
                x: { ticks: { font: { family: "Arial" }, color: "#aaa", size: 11 }, grid: { display: false } },
                y: {
                    ticks: {
                        callback: (v) => `₪${Number(v).toLocaleString("he-IL")}`,
                        font: { family: "Arial", size: 10 },
                        color: "#aaa",
                    },
                    grid: { color: "#f5f5f5" },
                },
            },
        },
    });
}

// ─── Horizontal Bar ──────────────────────────────────────────────────────────
function HBar({ label, value, maxValue, color, suffix = "" }) {
    const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <div style={{ fontSize: 12, color: "#666", minWidth: 90, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{label}</div>
            <div style={{ flex: 1, height: 8, background: "#f5f5f5", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#444", minWidth: 70, textAlign: "left" }}>{suffix}{Number(value).toLocaleString("he-IL")} ₪</div>
        </div>
    );
}

// ─── Weekday Bar ─────────────────────────────────────────────────────────────
// הסבר: MongoDB מחזיר $dayOfWeek כאשר 1=ראשון ... 7=שבת
// המערך מגיע מהשרת בסדר [א, ב, ג, ד, ה, ו, ש]
// בדף RTL, flex מציג מימין לשמאל — צריך direction:ltr + להפוך את המערך
// כך שהתצוגה תהיה: א (ימין) → ש (שמאל) = סדר ישראלי נכון
function WeekdayChart({ data }) {
    if (!data || data.length === 0) return null;
    // נהפוך את המערך כדי שבסביבת RTL יוצג נכון: א בימין, ש בשמאל
    const reversed = [...data].reverse();
    const maxCount = Math.max(...reversed.map((d) => d.count), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, direction: "ltr" }}>
            {reversed.map((d, i) => {
                const pct = Math.round((d.count / maxCount) * 100);
                const isTop = d.count === maxCount && d.count > 0;
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 9, color: "#aaa" }}>{d.count > 0 ? d.count : ""}</div>
                        <div style={{ width: "100%", height: 60, display: "flex", alignItems: "flex-end" }}>
                            <div style={{
                                width: "100%",
                                height: `${Math.max(pct, d.count > 0 ? 8 : 0)}%`,
                                background: isTop ? "#534AB7" : pct > 50 ? "#7F77DD" : "#EEEDFE",
                                border: isTop ? "none" : "1px solid #AFA9EC",
                                borderRadius: "3px 3px 0 0",
                                transition: "height 0.5s ease",
                            }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#888" }}>{d.label}</div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ w = "100%", h = 16 }) {
    return <div style={{ width: w, height: h, borderRadius: 6, background: "#f0f0f0", marginBottom: 6 }} />;
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ buckets, grandTotal, grandCount }) {
    const canvasRef = useRef();

    useEffect(() => {
        if (!buckets || buckets.length === 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const draw = () => {
            const existing = window.Chart?.getChart?.(canvas);
            if (existing) existing.destroy();

            const active = buckets.filter((b) => b.count > 0);
            if (active.length === 0) return;

            new window.Chart(canvas, {
                type: "doughnut",
                data: {
                    labels: active.map((b) => b.label),
                    datasets: [{
                        data: active.map((b) => b.count),
                        backgroundColor: active.map((b) => b.color),
                        borderColor: "#fff",
                        borderWidth: 3,
                        hoverOffset: 6,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "68%",
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const b = active[ctx.dataIndex];
                                    return ` ${b.count} לקוחות (${b.pctCount}%)`;
                                },
                                afterLabel: (ctx) => {
                                    const b = active[ctx.dataIndex];
                                    return ` סה״כ: ₪${Math.round(b.total).toLocaleString("he-IL")}`;
                                },
                            },
                        },
                    },
                },
            });
        };

        if (window.Chart) { draw(); return; }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
        script.onload = draw;
        document.head.appendChild(script);
    }, [buckets]);

    if (!buckets || buckets.every((b) => b.count === 0)) {
        return <div style={{ padding: "32px 0", textAlign: "center", color: "#ccc", fontSize: 13 }}>אין חובות פתוחים</div>;
    }

    const fmtILS = (n) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);

    return (
        <div>
            {/* Donut */}
            <div style={{ position: "relative", width: "100%", height: 160 }}>
                <canvas ref={canvasRef} role="img" aria-label="תרשים עוגה של התפלגות חובות לפי טווח" />
                {/* מרכז הדונאט */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 500 }}>לקוחות חייבים</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1 }}>{grandCount}</div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
                {buckets.map((b) => (
                    <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 9, height: 9, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 11, color: "#555" }}>{b.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{b.count}</div>
                        <div style={{ fontSize: 10, color: "#aaa", minWidth: 32, textAlign: "left" }}>({b.pctCount}%)</div>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "0.5px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#aaa" }}>סה״כ חוב כולל</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#A32D2D" }}>{fmtILS(grandTotal)}</span>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
    const navigate = useNavigate();
    const [period, setPeriod] = useState("month");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [debtDist, setDebtDist] = useState(null);
    const [debtDistLoading, setDebtDistLoading] = useState(true);

    useEffect(() => {
        fetchData(period);
    }, [period]);

    // جلب توزيع الديون — مرة واحدة فقط، لا يتغير بالفترة
    const fetchDebtDist = async () => {
        try {
            setDebtDistLoading(true);
            const res = await api.get("/analytics/debt-distribution");
            setDebtDist(res.data);
        } catch {
            // silent
        } finally { setDebtDistLoading(false); }
    };

    useEffect(() => {
        fetchDebtDist();
    }, []);

    const fetchData = async (p) => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get(`/analytics/overview?period=${p}`);
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "שגיאה בטעינת הנתונים");
        } finally {
            setLoading(false);
        }
    };

    const periods = [
        { key: "day", label: "יום" },
        { key: "week", label: "שבוע" },
        { key: "month", label: "חודש" },
        { key: "year", label: "שנה" },
    ];

    const kpis = data?.kpis || {};
    const monthlyChart = data?.monthlyChart || [];
    const topCategories = data?.topCategories || [];
    const topItems = data?.topItems || [];
    const weekdayData = data?.weekdayData || [];
    const topDebtors = data?.topDebtors || [];

    const maxCat = topCategories[0]?.total || 1;
    const maxItem = topItems[0]?.total || 1;
    const busyDay = weekdayData.reduce((a, b) => (b.count > a.count ? b : a), { count: 0, label: "" });

    return (
        <div style={{ direction: "rtl", minHeight: "100vh", background: "#F5F6FA", padding: "16px", boxSizing: "border-box", fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif" }}>
            <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .kpi-grid   { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
        .main-grid  { display:grid; grid-template-columns:1.4fr 1fr; gap:10px; }
        .dist-grid  { display:grid; grid-template-columns:1fr 2fr; gap:10px; }
        .bottom-grid{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
        .period-btn { border:0.5px solid #ddd; background:#fff; border-radius:20px; padding:5px 12px; font-size:12px; color:#888; cursor:pointer; font-family:inherit; transition:all 0.15s; }
        .period-btn.active { background:#534AB7; color:#fff; border-color:#534AB7; }
        .period-btn:hover:not(.active) { border-color:#AFA9EC; color:#534AB7; }
        .bucket-bar { display:block; }
        /* ── Tablet ── */
        @media (max-width: 900px) {
          .kpi-grid    { grid-template-columns:repeat(2,1fr) !important; }
          .main-grid   { grid-template-columns:1fr !important; }
          .dist-grid   { grid-template-columns:1fr !important; }
          .bottom-grid { grid-template-columns:1fr !important; }
        }
        /* ── Mobile ── */
        @media (max-width: 540px) {
          .kpi-grid    { grid-template-columns:repeat(2,1fr) !important; gap:8px !important; }
          .dist-grid   { grid-template-columns:1fr !important; }
          .bottom-grid { grid-template-columns:1fr !important; gap:8px !important; }
          .bucket-bar  { display:none !important; }
          .period-btn  { padding:5px 8px !important; font-size:11px !important; }
          .ana-header  { flex-direction:column !important; align-items:flex-start !important; }
          .ana-header-right { width:100% !important; justify-content:space-between !important; }
        }
      `}</style>

            <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>

                {/* ── Header ── */}
                <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, borderRadius: 9, border: "0.5px solid #e8e8e8", background: "#f5f5f5", color: "#666", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{Icon.back}</button>
                        <div>
                            <div style={{ fontSize: 10, color: "#534AB7", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 2 }}>מערכת ניהול חשבונות</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>דוחות ואנליטיקה</div>
                            <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>ניתוח נתונים, מגמות ודוחות</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {periods.map((p) => (
                                <button key={p.key} className={`period-btn${period === p.key ? " active" : ""}`} onClick={() => setPeriod(p.key)}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => { fetchData(period); fetchDebtDist(); }}
                            disabled={loading || debtDistLoading}
                            title="רענן נתונים"
                            style={{ width: 34, height: 34, borderRadius: 9, border: "0.5px solid #e8e8e8", background: "#f5f5f5", color: "#666", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: loading || debtDistLoading ? 0.5 : 1, transition: "opacity 0.15s", flexShrink: 0 }}
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ animation: loading || debtDistLoading ? "spin 1s linear infinite" : "none" }}>
                                <path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                <path d="M12 4l.5 2.5L15 6M1 10l2.5.5L4 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{error}</div>
                )}

                {/* ── KPI Cards ── */}
                {loading ? (
                    <div className="kpi-grid">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: 18 }}>
                                <Sk w="50%" h={12} /><Sk w="70%" h={26} /><Sk w="40%" h={11} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="kpi-grid">
                        <KPICard label="יתרת חוב כוללת" value={fmtCurrency(kpis.totalDebt)} sub="חשבונות פתוחים" icon={Icon.wallet} color={C.red} change={kpis.debtChange} />
                        <KPICard label="לקוחות עם חוב" value={kpis.customersInDebt} sub={`מתוך ${kpis.customersCount} לקוחות`} icon={Icon.people} color={C.purple} />
                        <KPICard label="חובות בתקופה" value={fmtCurrency(kpis.periodDebts)} sub={`תשלומים: ${fmtCurrency(kpis.periodPayments)}`} icon={Icon.chart} color={C.amber} />
                        <KPICard label="המרת הצעות מחיר" value={`${kpis.quoteConversionRate}%`} sub={`${kpis.convertedQuotes} מתוך ${kpis.totalQuotes}`} icon={Icon.convert} color={C.teal} />
                    </div>
                )}

                {/* ── Main Row: Monthly Chart + Categories ── */}
                <div className="main-grid">

                    {/* Monthly Chart */}
                    <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
                        <SectionHeader icon={Icon.chart} title="חובות ותשלומים — 6 חודשים אחרונים" color={C.purple} />
                        <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#888" }}>
                                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#FCEBEB", border: "1px solid #A32D2D", display: "inline-block" }} />חובות
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#888" }}>
                                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#E1F5EE", border: "1px solid #0F6E56", display: "inline-block" }} />תשלומים
                            </span>
                        </div>
                        {loading ? <Sk h={200} /> : <MonthlyBarChart data={monthlyChart} />}
                    </div>

                    {/* Top Categories */}
                    <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
                        <SectionHeader icon={Icon.tag} title="קטגוריות מובילות" color={C.amber} />
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => <Sk key={i} h={12} />)
                        ) : topCategories.length === 0 ? (
                            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "32px 0" }}>אין נתונים לתקופה זו</div>
                        ) : (() => {
                            const catColors = ["#854F0B","#534AB7","#0F6E56","#E24B4A","#185FA5","#993556"];
                            return topCategories.map((cat, i) => (
                                <HBar key={cat.name} label={cat.name} value={cat.total} maxValue={maxCat} color={catColors[i % catColors.length]} />
                            ));
                        })()}
                    </div>
                </div>

                {/* ── Debt Distribution Row ── */}
                <div className="dist-grid">

                    {/* Donut Card */}
                    <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
                        <SectionHeader icon={Icon.warn} title="התפלגות חובות לפי טווח" color={C.red} />
                        {debtDistLoading ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <Sk h={180} /><Sk w="70%" h={12} /><Sk w="60%" h={12} /><Sk w="50%" h={12} />
                            </div>
                        ) : (
                            <DonutChart
                                buckets={debtDist?.buckets || []}
                                grandTotal={debtDist?.grandTotal || 0}
                                grandCount={debtDist?.grandCount || 0}
                            />
                        )}
                    </div>

                    {/* Buckets Detail Table */}
                    <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
                        <SectionHeader icon={Icon.chart} title="פירוט לפי טווח חוב" color={C.purple} />
                        {debtDistLoading ? (
                            [1,2,3,4].map(i => <Sk key={i} h={44} style={{ marginBottom: 8 }} />)
                        ) : !debtDist?.buckets?.some(b => b.count > 0) ? (
                            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "40px 0" }}>אין חובות פתוחים</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {debtDist.buckets.map((b) => (
                                    <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: b.count > 0 ? "#FAFAFA" : "#fff", border: `0.5px solid ${b.count > 0 ? "#f0f0f0" : "#f5f5f5"}`, flexWrap: "wrap" }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 3, background: b.color, flexShrink: 0 }} />
                                        <div style={{ flex: 1, fontSize: 12, color: "#444", fontWeight: 500, minWidth: 80 }}>{b.label}</div>
                                        <span style={{ background: b.count > 0 ? b.color : "#eee", color: b.count > 0 ? "#fff" : "#bbb", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                            {b.count} לקוחות ({b.pctCount}%)
                                        </span>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: b.count > 0 ? "#1a1a1a" : "#ccc", minWidth: 80, textAlign: "left", flexShrink: 0 }}>
                                            {b.count > 0 ? `₪${Math.round(b.total).toLocaleString("he-IL")}` : "—"}
                                        </div>
                                        <div className="bucket-bar" style={{ width: 70, height: 5, background: "#f0f0f0", borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
                                            <div style={{ height: "100%", width: `${b.pctTotal}%`, background: b.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                                        </div>
                                    </div>
                                ))}
                                <div style={{ marginTop: 4, paddingTop: 10, borderTop: "0.5px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 12, color: "#888" }}>סה״כ לקוחות חייבים: <strong style={{ color: "#1a1a1a" }}>{debtDist.grandCount}</strong></span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#A32D2D" }}>₪{Math.round(debtDist.grandTotal).toLocaleString("he-IL")}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Bottom Row ── */}
                <div className="bottom-grid">

                    {/* Top Debtors */}
                    <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
                        <SectionHeader icon={Icon.warn} title="חייבים גדולים" color={C.red} />
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => <Sk key={i} h={40} />)
                        ) : topDebtors.length === 0 ? (
                            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "32px 0" }}>אין חובות פתוחים</div>
                        ) : topDebtors.map((d, i) => {
                            const av = avatarColor(d.name);
                            return (
                                <div key={i} onClick={() => d.customerId && navigate(`/account/${d.customerId}`)}
                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < topDebtors.length - 1 ? "0.5px solid #f5f5f5" : "none", cursor: "pointer" }}>
                                    <span style={{ fontSize: 10, color: "#ccc", width: 14, textAlign: "center" }}>{i + 1}</span>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: av.bg, color: av.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials(d.name)}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                                        {d.phone && <div style={{ fontSize: 11, color: "#aaa" }}>{d.phone}</div>}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: C.red.text, flexShrink: 0 }}>{fmtCurrency(d.balance)}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Top Items */}
                    <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
                        <SectionHeader icon={Icon.tag} title="פריטים מובילים" color={C.blue} />
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => <Sk key={i} h={12} />)
                        ) : topItems.length === 0 ? (
                            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "32px 0" }}>אין נתונים לתקופה זו</div>
                        ) : (
                            topItems.map((item, i) => {
                                const itemColors = ["#534AB7","#0F6E56","#E24B4A","#EF9F27","#185FA5","#993556","#854F0B","#5F5E5A"];
                                return <HBar key={item.name} label={item.name} value={item.total} maxValue={maxItem} color={itemColors[i % itemColors.length]} />;
                            })
                        )}
                    </div>

                    {/* Weekday Activity + Conversion */}
                    <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

                        {/* Weekday */}
                        <div>
                            <SectionHeader icon={Icon.chart} title="פעילות לפי יום" color={C.purple} />
                            {loading ? <Sk h={80} /> : (
                                <>
                                    <WeekdayChart data={weekdayData} />
                                    {busyDay.count > 0 && (
                                        <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
                                            הכי פעיל: <strong style={{ color: "#534AB7" }}>יום {busyDay.label}׳</strong>
                                            <span style={{ color: "#ccc" }}> · {busyDay.count} עסקאות</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Conversion rates */}
                        <div style={{ borderTop: "0.5px solid #f0f0f0", paddingTop: 16 }}>
                            <SectionHeader icon={Icon.convert} title="יחס המרות" color={C.teal} />
                            {loading ? <Sk h={50} /> : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {[
                                        { label: "הצעות מחיר", pct: kpis.quoteConversionRate, color: "#534AB7" },
                                        { label: "תעודות משלוח", pct: kpis.noteConversionRate, color: "#0F6E56" },
                                    ].map((row) => (
                                        <div key={row.label}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: "#666" }}>
                                                <span>{row.label}</span>
                                                <span style={{ fontWeight: 700, color: row.color }}>{row.pct}%</span>
                                            </div>
                                            <div style={{ height: 6, background: "#f5f5f5", borderRadius: 99, overflow: "hidden" }}>
                                                <div style={{ height: "100%", width: `${row.pct}%`, background: row.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
