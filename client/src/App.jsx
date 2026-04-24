import { useEffect, useMemo, useState } from "react";
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

function App() {
  const [mode] = useState("light");
  const [isLocked, setIsLocked] = useState(false);

  const { isAuthenticated, authLoading } = useAuth();

  const theme = useMemo(() => getTheme(mode), [mode]);
  const cacheRtl = useMemo(() => createRtlCache(), []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLocked(false);
      return;
    }

    let timeout;

    const resetTimer = () => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        setIsLocked(true);
      }, 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeout);

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated]);

  if (authLoading) {
    return <div style={{ padding: 24 }}>טוען...</div>;
  }

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          {isAuthenticated ? (
            <>
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

              {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}
            </>
          ) : (
            <LoginPage />
          )}
        </BrowserRouter>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;