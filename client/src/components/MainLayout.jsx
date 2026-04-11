import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  Box,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalSearch from "./GlobalSearch";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { label: "לוח בקרה", path: "/" },
    { label: "לקוחות", path: "/customers" },
    { label: "פריטים", path: "/items" },
    { label: "הצעות מחיר", path: "/quotes" },
    { label: "הגדרות", path: "/settings" },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const isActivePath = (path) => {
    if (path === "/") return location.pathname === "/";
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f8fc" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: "72px !important",
            px: { xs: 2, md: 3 },
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              minWidth: 180,
            }}
          >
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                whiteSpace: "nowrap",
                cursor: "pointer",
                letterSpacing: "-0.02em",
              }}
              onClick={() => navigate("/")}
            >
              Yasmine Ledger
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: { xs: "100%", md: 280 },
              display: "flex",
              justifyContent: "center",
              order: { xs: 3, md: 2 },
            }}
          >
            <GlobalSearch />
          </Box>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            justifyContent="flex-end"
            sx={{
              minWidth: { xs: "100%", md: "auto" },
              order: { xs: 2, md: 3 },
            }}
          >
            {navItems.map((item) => {
              const active = isActivePath(item.path);

              return (
                <Button
                  key={item.path}
                  variant={active ? "contained" : "text"}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2.5,
                    px: 1.75,
                    fontWeight: 700,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </Button>
              );
            })}

            <Button
              color="error"
              onClick={handleLogout}
              sx={{
                borderRadius: 2.5,
                px: 1.75,
                fontWeight: 700,
                textTransform: "none",
                whiteSpace: "nowrap",
              }}
            >
              יציאה
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          p: { xs: 2, md: 3 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}