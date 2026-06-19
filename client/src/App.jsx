import { useEffect, useMemo, useState, createContext, useContext } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { getTheme } from "./theme/theme";
import { createRtlCache } from "./theme/rtl";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CustomersPage from "./pages/CustomersPage";
import AccountPage from "./pages/AccountPage";
import ItemsPage from "./pages/ItemsPage";
import QuotesPage from "./pages/QuotesPage";
import SettingsPage from "./pages/SettingsPage";

import MainLayout from "./components/MainLayout";
import LockScreen from "./components/LockScreen";
import { useAuth } from "./context/AuthContext";
import DeliveryNotesPage from "./pages/DeliveryNotesPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export const DarkModeContext = createContext({ dark: false, toggle: () => { } });
export const useDarkMode = () => useContext(DarkModeContext);

const darkStyles = `
  .dm-page-content {
    filter: invert(93%) hue-rotate(180deg);
    transition: filter 0.2s ease;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    will-change: filter;
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  .dm-page-content img,
  .dm-page-content canvas,
  .dm-page-content video { filter: invert(93%) hue-rotate(180deg); }
  .dm-modal-root { filter: invert(93%) hue-rotate(180deg); }
  .dm-modal-root img { filter: invert(93%) hue-rotate(180deg); }
`;

const LOCK_KEY = "yl-screen-locked";

function App() {
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem(LOCK_KEY) === "true");
  const [dark, setDark] = useState(() => localStorage.getItem("yl-theme") === "dark");
  const { isAuthenticated, authLoading } = useAuth();

  const mode = dark ? "dark" : "light";
  const theme = useMemo(() => getTheme(mode), [mode]);
  const cacheRtl = useMemo(() => createRtlCache(), []);

  const toggleDark = () => setDark(d => !d);

  useEffect(() => {
    localStorage.setItem("yl-theme", dark ? "dark" : "light");
    document.body.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      localStorage.removeItem(LOCK_KEY);
      setIsLocked(false);
      return;
    }
    let timeout;
    const lock = () => {
      localStorage.setItem(LOCK_KEY, "true");
      setIsLocked(true);
    };
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(lock, 60 * 1000);
    };
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated, authLoading]);

  const handleUnlock = () => {
    localStorage.removeItem(LOCK_KEY);
    setIsLocked(false);
  };

  const darkWrapper = (children) => (
    <DarkModeContext.Provider value={{ dark, toggle: toggleDark }}>
      {dark && <style>{darkStyles}</style>}
      {children}
    </DarkModeContext.Provider>
  );

  // ✅ الأولوية القصوى: إذا localStorage يقول مقفل → اعرض LockScreen فوراً
  // حتى لو authLoading=true — لا نسمح بأي تجاوز بـ F5
  if (isLocked) {
    return darkWrapper(<LockScreen onUnlock={handleUnlock} />);
  }

  // انتظر التحقق من الجلسة فقط إذا لم يكن مقفلاً
  if (authLoading) {
    return darkWrapper(
      <div style={{
        padding: 24, minHeight: "100vh",
        background: dark ? "#0f1117" : "#fff",
        color: dark ? "#d4d6e0" : "#1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}>
        טוען...
      </div>
    );
  }

  return darkWrapper(
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          {isAuthenticated ? (
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="account/:customerId" element={<AccountPage />} />
                <Route path="items" element={<ItemsPage />} />
                <Route path="quotes" element={<QuotesPage />} />
                <Route path="delivery-notes" element={<DeliveryNotesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          ) : (
            <LoginPage />
          )}
        </BrowserRouter>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
