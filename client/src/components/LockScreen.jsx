import { useState } from "react";

const Icon = {
  lock:   <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect x="6" y="14" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M10 14v-4a6 6 0 0112 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="16" cy="21" r="2" fill="currentColor"/></svg>,
  eye:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  eyeOff: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10M4 4.9C2.5 6 1 8 1 8s3 5 7 5c1.4 0 2.7-.5 3.8-1.2M7 3.1C7.3 3 7.7 3 8 3c4 0 7 5 7 5s-.7 1.2-2 2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
};

export default function LockScreen({ onUnlock }) {
  const [code, setCode]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [shake, setShake]       = useState(false);

  const handleUnlock = async () => {
    if (!code.trim()) return;
    try {
      setError(""); setLoading(true);

      const res = await fetch("/api/auth/verify-lock-code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockCode: code }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success === true) {
        setCode("");
        onUnlock();
        return;
      }

      const msg = data.message || "קוד שגוי, נסה שוב";
      throw new Error(msg);

    } catch (err) {
      setError(err.message || "קוד שגוי, נסה שוב");
      setCode("");
      // ✅ shake بدون إعادة fadeUp
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#534AB7",
      backgroundImage: `
        radial-gradient(circle at 15% 85%, #3C3489 0%, transparent 45%),
        radial-gradient(circle at 85% 15%, #7F77DD 0%, transparent 45%),
        radial-gradient(circle at 50% 50%, #4338CA 0%, transparent 70%)
      `,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
      direction: "rtl",
      padding: "16px",
      boxSizing: "border-box",
    }}>

      {[
        { size: 400, top: -120, right: -100 },
        { size: 250, bottom: -60, left: -80 },
        { size: 150, top: "30%", left: "10%" },
        { size: 100, bottom: "20%", right: "8%" },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute", width: c.size, height: c.size,
          borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)",
          top: c.top, bottom: c.bottom, right: c.right, left: c.left,
          pointerEvents: "none",
        }} />
      ))}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .lock-input:focus { border-color: #534AB7 !important; box-shadow: 0 0 0 3px #EEEDFE !important; outline: none; }
        .unlock-btn:hover:not(:disabled) { background: #4338CA !important; }
        .unlock-btn:active:not(:disabled) { transform: scale(0.98); }
        .lock-card-wrap { animation: fadeUp 0.35s ease; }
        .lock-card-shake { animation: shake 0.45s ease; }
        @media (max-width: 400px) {
          .lock-card { padding: 28px 20px 24px !important; border-radius: 14px !important; }
          .lock-icon-wrap { width: 54px !important; height: 54px !important; border-radius: 14px !important; }
          .lock-title { font-size: 16px !important; }
          .lock-code-input { font-size: 16px !important; padding: 10px 14px 10px 36px !important; }
        }
      `}</style>

      {/* ✅ wrapper ثابت بـ fadeUp مرة واحدة فقط عند الظهور */}
      <div className="lock-card-wrap" style={{ width: "100%", maxWidth: 360 }}>
        {/* ✅ shake على الـ card فقط بدون إعادة fadeUp */}
        <div className={shake ? "lock-card-shake" : ""}>
          <div className="lock-card" style={{
            background: "#fff", borderRadius: 18,
            padding: "36px 36px 32px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            boxSizing: "border-box",
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <div className="lock-icon-wrap" style={{
                width: 64, height: 64, borderRadius: 18,
                background: "#EEEDFE", color: "#534AB7",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>
                {Icon.lock}
              </div>
              <div className="lock-title" style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
                המערכת נעולה
              </div>
              <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", lineHeight: 1.5 }}>
                הזן את קוד הנעילה כדי להמשיך
              </div>
            </div>

            <div style={{ marginBottom: error ? 10 : 20 }}>
              <div style={{ position: "relative" }}>
                <input
                  className="lock-input lock-code-input"
                  type={showCode ? "text" : "password"}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUnlock()}
                  placeholder="הזן קוד נעילה..."
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: `0.5px solid ${error ? "#F09595" : "#ddd"}`,
                    borderRadius: 10, padding: "11px 14px 11px 40px",
                    fontSize: 18, letterSpacing: "0.2em",
                    color: "#1a1a1a", outline: "none", background: "#fff",
                    fontFamily: "inherit", direction: "ltr", textAlign: "center",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                />
                <button type="button" onClick={() => setShowCode(s => !s)} style={{
                  position: "absolute", top: "50%", left: 12,
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#bbb", padding: 0, display: "flex",
                }}>
                  {showCode ? Icon.eyeOff : Icon.eye}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "#FCEBEB", color: "#791F1F",
                border: "0.5px solid #F09595", borderRadius: 8,
                padding: "8px 12px", fontSize: 12, fontWeight: 600,
                marginBottom: 16, textAlign: "center",
              }}>
                {error}
              </div>
            )}

            <button className="unlock-btn" onClick={handleUnlock}
              disabled={loading || !code.trim()}
              style={{
                width: "100%", background: "#534AB7", color: "#fff",
                border: "none", borderRadius: 10,
                padding: "13px", fontSize: 14, fontWeight: 700,
                cursor: loading || !code.trim() ? "not-allowed" : "pointer",
                opacity: !code.trim() ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.15s, transform 0.1s",
                touchAction: "manipulation",
              }}
            >
              {loading
                ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : <><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> פתח</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}