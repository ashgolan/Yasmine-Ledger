import { useEffect, useState } from "react";
import { api } from "../api/axios";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  purple: { bg: "#EEEDFE", border: "#AFA9EC", icon: "#534AB7", text: "#3C3489" },
  red:    { bg: "#FCEBEB", border: "#F09595", icon: "#A32D2D", text: "#791F1F" },
  teal:   { bg: "#E1F5EE", border: "#5DCAA5", icon: "#0F6E56", text: "#085041" },
  amber:  { bg: "#FAEEDA", border: "#FAC775", icon: "#854F0B", text: "#633806" },
  gray:   { bg: "#F1EFE8", border: "#B4B2A9", icon: "#5F5E5A", text: "#444441" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  store:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6l6-4 6 4v8H2V6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 10h4v4H6z" stroke="currentColor" strokeWidth="1.3"/></svg>,
  phone:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5L6 7a7.9 7.9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  address:<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1C5.239 1 3 3.239 3 6c0 4 5 9 5 9s5-5 5-9c0-2.761-2.239-5-5-5z" stroke="currentColor" strokeWidth="1.3"/></svg>,
  doc:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h4M6 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  lock:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1" fill="currentColor"/></svg>,
  key:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8.5 9.5l5 5M11 11l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  shield: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2l5 2v4c0 3-2 5.5-5 6.5C5 13.5 3 11 3 8V4l5-2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  save:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 14V3l2-1h6l2 2v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><rect x="5" y="9" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  check:  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  eye:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  eyeOff: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10M4 4.9C2.5 6 1 8 1 8s3 5 7 5c1.4 0 2.7-.5 3.8-1.2M7 3.1C7.3 3 7.7 3 8 3c4 0 7 5 7 5s-.7 1.2-2 2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputStyle = {
  border: "0.5px solid #ddd", borderRadius: 8, padding: "9px 10px 9px 36px",
  fontSize: 13, color: "#1a1a1a", outline: "none", background: "#fff",
  width: "100%", boxSizing: "border-box",
  fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
  direction: "rtl",
};
const inputStyleRtl = {
  ...inputStyle,
  padding: "9px 36px 9px 10px",
};

function Field({ label, hint, icon, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", right: 11, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none", display: "flex" }}>{icon}</div>
        {children}
      </div>
      {hint && <div style={{ fontSize: 11, color: "#bbb" }}>{hint}</div>}
    </div>
  );
}

function PasswordField({ label, icon, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", right: 11, transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none", display: "flex" }}>{icon}</div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder || ""}
          style={{ ...inputStyleRtl, paddingLeft: 36 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: "absolute", top: "50%", left: 10, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", display: "flex", padding: 0 }}
        >
          {show ? Icon.eyeOff : Icon.eye}
        </button>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, color, children }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 24px", borderBottom: "0.5px solid #f0f0f0", background: "#FAFAFA" }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: color.bg, color: color.icon, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{title}</div>
        </div>
      </div>
      <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [form, setForm] = useState({ storeName: "", storePhone: "", storeAddress: "", footerText: "" });
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "", newLockCode: "", confirmNewLockCode: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  useEffect(() => {
    api.get("/settings").then(res => {
      setForm({
        storeName: res.data.storeName || "",
        storePhone: res.data.storePhone || "",
        storeAddress: res.data.storeAddress || "",
        footerText: res.data.footerText || "",
      });
    }).catch(err => setError(err.response?.data?.message || "שגיאה בטעינת ההגדרות"));
  }, []);

  const showSuccess = (msg) => { setSuccess(msg); setError(""); setTimeout(() => setSuccess(""), 3000); };
  const showError = (msg) => { setError(msg); setSuccess(""); };

  const handleSave = async () => {
    try {
      setLoadingGeneral(true);
      const res = await api.put("/settings", form);
      showSuccess(res.data.message || "ההגדרות נשמרו בהצלחה");
    } catch (err) {
      showError(err.response?.data?.message || "שגיאה בשמירת ההגדרות");
    } finally { setLoadingGeneral(false); }
  };

  const handleSaveSecurity = async () => {
    if (!securityForm.currentPassword.trim()) { showError("יש להזין את הסיסמה הנוכחית"); return; }
    if (!securityForm.newPassword.trim() && !securityForm.newLockCode.trim()) { showError("יש להזין סיסמה חדשה או קוד נעילה חדש"); return; }
    if (securityForm.newPassword.trim() && securityForm.newPassword !== securityForm.confirmNewPassword) { showError("אימות הסיסמה החדשה אינו תואם"); return; }
    if (securityForm.newLockCode.trim() && securityForm.newLockCode !== securityForm.confirmNewLockCode) { showError("אימות קוד הנעילה אינו תואם"); return; }
    try {
      setLoadingSecurity(true);
      const res = await api.put("/settings/security", {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
        newLockCode: securityForm.newLockCode,
      });
      showSuccess(res.data.message || "הגדרות האבטחה נשמרו בהצלחה");
      setSecurityForm({ currentPassword: "", newPassword: "", confirmNewPassword: "", newLockCode: "", confirmNewLockCode: "" });
    } catch (err) {
      showError(err.response?.data?.message || "שגיאה בשמירת הגדרות האבטחה");
    } finally { setLoadingSecurity(false); }
  };

  return (
    <div style={{
      direction: "rtl", minHeight: "100vh", background: "#F5F6FA",
      padding: "24px", fontFamily: "'Segoe UI','Arial Hebrew',Arial,sans-serif",
      boxSizing: "border-box",
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        input:focus, textarea:focus { border-color: #AFA9EC !important; box-shadow: 0 0 0 3px #EEEDFE !important; outline: none; }
        textarea { resize: vertical; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>

        {/* ── Header ── */}
        <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 14, padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "#534AB7", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>מערכת ניהול חשבונות</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>הגדרות</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>פרטי העסק, אבטחה והגדרות מערכת</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.gray.bg, color: C.gray.icon, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Icon.shield}
          </div>
        </div>

        {/* ── Alerts ── */}
        {success && (
          <div style={{ background: C.teal.bg, color: C.teal.text, border: `0.5px solid ${C.teal.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, animation: "slideIn 0.2s ease" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.teal.icon, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{Icon.check}</div>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, animation: "slideIn 0.2s ease" }}>
            {error}
          </div>
        )}

        {/* ── Business details ── */}
        <SectionCard title="פרטי העסק" icon={Icon.store} color={C.purple}>

          <Field label="שם העסק" icon={Icon.store}>
            <input value={form.storeName}
              onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))}
              placeholder="שם העסק שלך"
              style={inputStyleRtl} />
          </Field>

          <Field label="טלפון העסק" icon={Icon.phone}>
            <input value={form.storePhone}
              onChange={e => setForm(f => ({ ...f, storePhone: e.target.value }))}
              placeholder="050-0000000"
              style={inputStyleRtl} />
          </Field>

          <Field label="כתובת העסק" icon={Icon.address}>
            <input value={form.storeAddress}
              onChange={e => setForm(f => ({ ...f, storeAddress: e.target.value }))}
              placeholder="רחוב, עיר"
              style={inputStyleRtl} />
          </Field>

          <Field label="טקסט תחתון להדפסה" hint="יופיע בתחתית כל הדפסה" icon={Icon.doc}>
            <textarea value={form.footerText}
              onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))}
              placeholder="לדוגמה: תודה על הקנייה!"
              rows={3}
              style={{ ...inputStyleRtl, lineHeight: 1.6, paddingTop: 9 }} />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button onClick={handleSave} disabled={loadingGeneral} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#534AB7", color: "#fff", border: "none",
              borderRadius: 9, padding: "10px 22px", fontSize: 13, fontWeight: 600,
              cursor: loadingGeneral ? "not-allowed" : "pointer",
              opacity: loadingGeneral ? 0.7 : 1,
            }}>
              {Icon.save} {loadingGeneral ? "שומר..." : "שמור פרטי עסק"}
            </button>
          </div>
        </SectionCard>

        {/* ── Security ── */}
        <SectionCard title="אבטחה" icon={Icon.shield} color={C.amber}>

          <div style={{ background: C.amber.bg, border: `0.5px solid ${C.amber.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: C.amber.text, fontWeight: 500 }}>
            שינוי הסיסמה או קוד הנעילה ידרוש את הסיסמה הנוכחית
          </div>

          <PasswordField
            label="סיסמה נוכחית *"
            icon={Icon.key}
            value={securityForm.currentPassword}
            onChange={e => setSecurityForm(f => ({ ...f, currentPassword: e.target.value }))}
            placeholder="הסיסמה הנוכחית שלך"
          />

          <div style={{ height: "0.5px", background: "#f0f0f0" }} />

          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.04em", textTransform: "uppercase" }}>סיסמה חדשה</div>

          <PasswordField
            label="סיסמה חדשה"
            icon={Icon.lock}
            value={securityForm.newPassword}
            onChange={e => setSecurityForm(f => ({ ...f, newPassword: e.target.value }))}
            placeholder="הזן סיסמה חדשה"
          />

          <PasswordField
            label="אימות סיסמה חדשה"
            icon={Icon.lock}
            value={securityForm.confirmNewPassword}
            onChange={e => setSecurityForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
            placeholder="הזן שוב את הסיסמה החדשה"
          />

          <div style={{ height: "0.5px", background: "#f0f0f0" }} />

          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.04em", textTransform: "uppercase" }}>קוד נעילה</div>

          <PasswordField
            label="קוד נעילה חדש"
            icon={Icon.key}
            value={securityForm.newLockCode}
            onChange={e => setSecurityForm(f => ({ ...f, newLockCode: e.target.value }))}
            placeholder="הזן קוד נעילה חדש"
          />

          <PasswordField
            label="אימות קוד נעילה חדש"
            icon={Icon.key}
            value={securityForm.confirmNewLockCode}
            onChange={e => setSecurityForm(f => ({ ...f, confirmNewLockCode: e.target.value }))}
            placeholder="הזן שוב את קוד הנעילה"
          />

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button onClick={handleSaveSecurity} disabled={loadingSecurity} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#854F0B", color: "#FAEEDA", border: "none",
              borderRadius: 9, padding: "10px 22px", fontSize: 13, fontWeight: 600,
              cursor: loadingSecurity ? "not-allowed" : "pointer",
              opacity: loadingSecurity ? 0.7 : 1,
            }}>
              {Icon.shield} {loadingSecurity ? "שומר..." : "שמור הגדרות אבטחה"}
            </button>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
