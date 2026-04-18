import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  user:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  lock:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1" fill="currentColor"/></svg>,
  eye:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  eyeOff: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10M4 4.9C2.5 6 1 8 1 8s3 5 7 5c1.4 0 2.7-.5 3.8-1.2M7 3.1C7.3 3 7.7 3 8 3c4 0 7 5 7 5s-.7 1.2-2 2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  arrow:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password) { setError("יש למלא את כל השדות"); return; }
    try {
      setLoading(true);
      await login(form);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בהתחברות");
    } finally { setLoading(false); }
  };

  const inputBase = {
    width: "100%", boxSizing: "border-box",
    border: "0.5px solid #ddd", borderRadius: 9,
    padding: "11px 38px 11px 12px",
    fontSize: 14, color: "#1a1a1a", outline: "none",
    fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
    background: "#fff", direction: "rtl",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "#F5F6FA",
      fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
      direction: "rtl",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .login-input:focus { border-color: #AFA9EC !important; box-shadow: 0 0 0 3px #EEEDFE !important; }
        .login-btn:hover:not(:disabled) { background: #4338CA !important; }
        .login-btn:active:not(:disabled) { transform: scale(0.98); }

        /* ── Responsive ── */

        /* Desktop: side by side */
        .login-deco  { display: flex; }
        .login-panel { width: 480px; }

        /* Tablet / mobile: stack */
        @media (max-width: 768px) {
          .login-deco  { display: none !important; }
          .login-panel {
            width: 100% !important;
            min-height: 100vh;
            padding: 40px 24px !important;
            box-shadow: none !important;
            justify-content: center;
          }
          .login-logo-mobile { display: flex !important; }
        }

        @media (min-width: 769px) {
          .login-logo-mobile { display: none !important; }
        }

        /* Small mobile */
        @media (max-width: 380px) {
          .login-panel { padding: 32px 16px !important; }
          .login-title { font-size: 22px !important; }
        }
      `}</style>

      {/* ── Left decorative panel — Desktop only ── */}
      <div className="login-deco" style={{
        flex: 1, background: "#534AB7",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 48, position: "relative", overflow: "hidden",
      }}>
        {[
          { size: 300, top: -80,   right: -80, opacity: 0.08 },
          { size: 200, bottom: 40, left: -60,  opacity: 0.06 },
          { size: 120, top: "40%", left: "30%",opacity: 0.05 },
        ].map((c, i) => (
          <div key={i} style={{
            position: "absolute", width: c.size, height: c.size, borderRadius: "50%",
            background: "#fff", opacity: c.opacity,
            top: c.top, bottom: c.bottom, right: c.right, left: c.left,
          }} />
        ))}

        <div style={{ animation: "float 4s ease-in-out infinite", marginBottom: 32, position: "relative", zIndex: 1 }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M6 10h24M6 18h16M6 26h20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="28" cy="26" r="5" fill="#FAEEDA" stroke="#FAC775" strokeWidth="1.5"/>
              <path d="M26 26l1.5 1.5L30 24" stroke="#854F0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 10, letterSpacing: "-0.02em" }}>Yasmine Ledger</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 280 }}>
            מערכת ניהול חשבונות וחובות חכמה ומאובטחת
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 32, alignItems: "flex-start" }}>
            {[
              { icon: "📊", text: "לוח בקרה מתקדם" },
              { icon: "👥", text: "ניהול לקוחות בקלות" },
              { icon: "🧾", text: "הצעות מחיר ומעקב" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "7px 16px" }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right / Full login panel ── */}
      <div className="login-panel" style={{
        width: 480, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 40px", background: "#fff",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.04)",
      }}>
        <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp 0.4s ease" }}>

          {/* Logo — Mobile only ── */}
          <div className="login-logo-mobile" style={{ flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
                <path d="M6 10h24M6 18h16M6 26h20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="28" cy="26" r="5" fill="#FAEEDA" stroke="#FAC775" strokeWidth="1.5"/>
                <path d="M26 26l1.5 1.5L30 24" stroke="#854F0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>Yasmine Ledger</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>מערכת ניהול חשבונות</div>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: "#534AB7", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>ברוך הבא</div>
            <div className="login-title" style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>התחברות למערכת</div>
            <div style={{ fontSize: 13, color: "#aaa" }}>הזן את פרטי הכניסה שלך להמשך</div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595", borderRadius: 9, padding: "11px 14px", fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>שם משתמש</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{Icon.user}</div>
                <input
                  className="login-input"
                  name="username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="שם המשתמש שלך"
                  style={inputBase}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>סיסמה</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" }}>{Icon.lock}</div>
                <input
                  className="login-input"
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="הסיסמה שלך"
                  style={{ ...inputBase, paddingLeft: 38 }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: "absolute", top: "50%", left: 12, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: 0, display: "flex", touchAction: "manipulation" }}>
                  {showPass ? Icon.eyeOff : Icon.eye}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading} style={{
              width: "100%", marginTop: 8,
              background: "#534AB7", color: "#fff", border: "none", borderRadius: 9,
              padding: "13px", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.75 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.15s, transform 0.1s",
              touchAction: "manipulation",
            }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  מתחבר...
                </>
              ) : (
                <> התחבר {Icon.arrow} </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 28, textAlign: "center", fontSize: 11, color: "#ccc" }}>
            Yasmine Ledger · כל הזכויות שמורות
          </div>
        </div>
      </div>
    </div>
  );
}
