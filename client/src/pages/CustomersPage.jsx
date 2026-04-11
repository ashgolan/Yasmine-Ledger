import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Avatar,
  IconButton,
  InputAdornment,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  PersonAdd,
  Phone,
  Person,
  Search,
  AccountCircle,
  Close,
} from "@mui/icons-material";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

const theme = createTheme({
  direction: "rtl",
  palette: {
    primary: {
      main: "#111827",
    },
    secondary: {
      main: "#6b7280",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    success: {
      main: "#10b981",
    },
    error: {
      main: "#ef4444",
    },
  },
  typography: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    h4: {
      fontWeight: 700,
      fontSize: "1.9rem",
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "#fff",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
  },
});

export default function CustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setError("");
      setPageLoading(true);

      const res = await api.get("/customers");
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetch customers error:", err);
      setError(err.response?.data?.message || "שגיאה בטעינת לקוחות");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) return customers;

    return customers.filter((c) => {
      const fullName = c.fullName?.toLowerCase() || "";
      const phone = c.phone || "";
      const balance = String(c.balance ?? "");
      return (
        fullName.includes(q) ||
        phone.includes(searchQuery.trim()) ||
        balance.includes(searchQuery.trim())
      );
    });
  }, [customers, searchQuery]);

  const handleCreate = async () => {
    try {
      setError("");

      if (!form.fullName.trim()) {
        setError("יש להזין שם לקוח");
        return;
      }

      setLoading(true);

      await api.post("/customers", {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      });

      await fetchCustomers();

      setOpen(false);
      setForm({ fullName: "", phone: "" });
    } catch (err) {
      console.error("create customer error:", err);
      setError(err.response?.data?.message || "שגיאה ביצירת לקוח");
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    if (loading) return;
    setOpen(false);
    setForm({ fullName: "", phone: "" });
    setError("");
  };

  const getInitials = (name) => {
    if (!name?.trim()) return "?";

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].slice(0, 2);
    }

    return `${words[0][0]}${words[words.length - 1][0]}`;
  };

  const getAvatarColor = (name = "") => {
    const colors = [
      "#2563eb",
      "#7c3aed",
      "#db2777",
      "#059669",
      "#ea580c",
      "#0891b2",
      "#4f46e5",
      "#65a30d",
    ];

    const index =
      name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;

    return colors[index];
  };

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDebtLevel = (amount) => {
    const value = Number(amount || 0);

    if (value <= 0) {
      return {
        label: "ללא חוב",
        bg: "#ecfdf5",
        color: "#047857",
        dot: "#10b981",
      };
    }

    if (value <= 500) {
      return {
        label: "חוב נמוך",
        bg: "#eff6ff",
        color: "#1d4ed8",
        dot: "#3b82f6",
      };
    }

    if (value <= 2000) {
      return {
        label: "חוב בינוני",
        bg: "#fffbeb",
        color: "#b45309",
        dot: "#f59e0b",
      };
    }

    if (value <= 5000) {
      return {
        label: "חוב גבוה",
        bg: "#fff7ed",
        color: "#c2410c",
        dot: "#f97316",
      };
    }

    return {
      label: "חוב גבוה מאוד",
      bg: "#fef2f2",
      color: "#b91c1c",
      dot: "#ef4444",
    };
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        dir="rtl"
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          py: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 3,
              background:
                "linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(37,99,235,0.05) 100%)",
              border: "1px solid rgba(99,102,241,0.08)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
              spacing={2}
            >
              <Box>
                <Typography variant="h4" sx={{ color: "primary.main", mb: 0.5 }}>
                  לקוחות
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ניהול רשימת הלקוחות שלך בצורה נוחה, מהירה ומסודרת
                </Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Chip
                  label={`${customers.length} לקוחות`}
                  sx={{
                    bgcolor: "white",
                    border: "1px solid #e5e7eb",
                    fontWeight: 600,
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setOpen(true)}
                  sx={{
                    px: 2.5,
                    background:
                      "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #4338ca 0%, #1d4ed8 100%)",
                    },
                  }}
                >
                  לקוח חדש
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="חפש לפי שם לקוח, טלפון או סכום..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery("")} edge="end">
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Paper>

          {error && !open && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          {pageLoading ? (
            <Paper
              sx={{
                p: 6,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress />
            </Paper>
          ) : filteredCustomers.length === 0 ? (
            <Paper
              sx={{
                p: { xs: 4, md: 7 },
                textAlign: "center",
              }}
            >
              <AccountCircle
                sx={{
                  fontSize: 70,
                  color: "text.secondary",
                  opacity: 0.35,
                  mb: 2,
                }}
              />

              <Typography variant="h6" sx={{ mb: 1 }}>
                {searchQuery ? "לא נמצאו לקוחות" : "אין לקוחות להצגה"}
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery
                  ? "נסה לחפש בשם אחר, מספר טלפון או סכום אחר"
                  : "אפשר להתחיל ביצירת לקוח חדש"}
              </Typography>

              {!searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setOpen(true)}
                  sx={{
                    background:
                      "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
                  }}
                >
                  צור לקוח ראשון
                </Button>
              )}
            </Paper>
          ) : (
            <Paper sx={{ overflow: "hidden" }}>
              <Stack>
                {filteredCustomers.map((c, index) => {
                  const debtInfo = getDebtLevel(c.balance);

                  return (
                    <Box
                      key={c._id}
                      onClick={() => navigate(`/account/${c._id}`)}
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        cursor: "pointer",
                        transition: "0.2s ease",
                        borderBottom:
                          index !== filteredCustomers.length - 1
                            ? "1px solid #eef2f7"
                            : "none",
                        "&:hover": {
                          bgcolor: "#f8fafc",
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            width: 52,
                            height: 52,
                            fontWeight: 700,
                            bgcolor: getAvatarColor(c.fullName),
                          }}
                        >
                          {getInitials(c.fullName)}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1}
                            sx={{ mb: 0.7 }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 700,
                                color: "primary.main",
                                fontSize: "1rem",
                              }}
                            >
                              {c.fullName || "-"}
                            </Typography>

                            <Typography
                              sx={{
                                fontWeight: 800,
                                color:
                                  Number(c.balance || 0) > 0
                                    ? debtInfo.color
                                    : "#047857",
                                fontSize: { xs: "0.95rem", sm: "1rem" },
                                bgcolor: debtInfo.bg,
                                px: 1.2,
                                py: 0.6,
                                borderRadius: 999,
                              }}
                            >
                              {formatCurrency(c.balance)}
                            </Typography>
                          </Stack>

                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            useFlexGap
                          >
                            <Stack
                              direction="row"
                              spacing={0.8}
                              alignItems="center"
                              sx={{ color: "text.secondary" }}
                            >
                              <Phone sx={{ fontSize: 16 }} />
                              <Typography variant="body2">
                                {c.phone || "ללא מספר טלפון"}
                              </Typography>
                            </Stack>

                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.8,
                                px: 1.2,
                                py: 0.45,
                                borderRadius: 999,
                                bgcolor: debtInfo.bg,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: debtInfo.dot,
                                  flexShrink: 0,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: debtInfo.color,
                                  fontWeight: 700,
                                  fontSize: "0.78rem",
                                }}
                              >
                                {debtInfo.label}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        <Chip
                          label="פתח חשבון"
                          size="small"
                          sx={{
                            display: { xs: "none", md: "flex" },
                            bgcolor: "#eef2ff",
                            color: "#4338ca",
                            fontWeight: 700,
                          }}
                        />
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          )}

          <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              לקוח חדש
            </DialogTitle>

            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label="שם מלא"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="טלפון"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                {error && (
                  <Alert severity="error" sx={{ borderRadius: 3 }}>
                    {error}
                  </Alert>
                )}
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={handleDialogClose} disabled={loading}>
                ביטול
              </Button>

              <Button
                onClick={handleCreate}
                variant="contained"
                disabled={loading}
                sx={{
                  minWidth: 100,
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #4338ca 0%, #1d4ed8 100%)",
                  },
                }}
              >
                {loading ? "שומר..." : "שמור"}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </ThemeProvider>
  );
}