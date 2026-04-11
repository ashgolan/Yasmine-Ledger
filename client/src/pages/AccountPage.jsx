import { useEffect, useState, useRef } from "react";
import {
    Box,
    Typography,
    Paper,
    Stack,
    Chip,
    TextField,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    Autocomplete,
    Container,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Create a cohesive theme
const theme = createTheme({
    direction: "rtl",
    palette: {
        primary: {
            main: "#030213",
        },
        secondary: {
            main: "#717182",
        },
        success: {
            main: "#10b981",
            light: "#d1fae5",
        },
        error: {
            main: "#ef4444",
            light: "#fee2e2",
        },
        warning: {
            main: "#f59e0b",
            light: "#fef3c7",
        },
        background: {
            default: "#f9fafb",
            paper: "#ffffff",
        },
    },
    typography: {
        fontFamily: "system-ui, -apple-system, sans-serif",
        h4: {
            fontWeight: 600,
            fontSize: "1.875rem",
        },
        h6: {
            fontWeight: 600,
            fontSize: "1.25rem",
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 500,
                    borderRadius: "0.5rem",
                },
                contained: {
                    boxShadow: "none",
                    "&:hover": {
                        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: "0.75rem",
                    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: "0.375rem",
                    fontWeight: 500,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: "0.5rem",
                    },
                },
            },
        },
    },
});

export default function App() {
    // Mock customer ID - in real app this would come from routing
    const customerId = "demo-customer";

    const [data, setData] = useState(null);
    const [items, setItems] = useState([]);
    const [settings, setSettings] = useState(null);

    const [tab, setTab] = useState(0);
    const [archivedAccounts, setArchivedAccounts] = useState([]);
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [selectedArchivedAccount, setSelectedArchivedAccount] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const [form, setForm] = useState({
        type: "debt",
        date: new Date().toISOString().slice(0, 10),
        description: "",
        quantity: "",
        unitPrice: "",
        amount: "",
    });

    const dateRef = useRef(null);
    const typeRef = useRef(null);
    const descriptionRef = useRef(null);
    const quantityRef = useRef(null);
    const unitPriceRef = useRef(null);
    const amountRef = useRef(null);

    // Mock data for demo
    useEffect(() => {
        // Simulate API calls with mock data
        setData({
            account: { _id: "acc-001" },
            transactions: [
                {
                    _id: "t1",
                    date: "2026-04-01",
                    type: "debt",
                    description: "מוצר לדוגמה",
                    quantity: 5,
                    unitPrice: 100,
                    amount: 500,
                },
                {
                    _id: "t2",
                    date: "2026-04-05",
                    type: "payment",
                    description: "תשלום חלקי",
                    quantity: 0,
                    unitPrice: 0,
                    amount: 300,
                },
            ],
            balance: 200,
        });

        setItems([
            { id: "1", name: "מוצר א", price: 100 },
            { id: "2", name: "מוצר ב", price: 150 },
            { id: "3", name: "מוצר ג", price: 200 },
        ]);

        setSettings({
            storeName: "חנות לדוגמה",
            storePhone: "050-1234567",
            storeAddress: "רחוב הדוגמה 123",
            footerText: "תודה על הקנייה",
        });

        setArchivedAccounts([]);
    }, [customerId]);

    const focusField = (ref) => {
        if (ref?.current) {
            const input =
                ref.current.querySelector?.("input") ||
                ref.current.querySelector?.("textarea") ||
                ref.current;
            input?.focus?.();
            input?.select?.();
        }
    };

    const handleQuickEnter = async (e, field) => {
        if (e.key !== "Enter") return;
        e.preventDefault();

        if (field === "date") {
            focusField(typeRef);
            return;
        }

        if (field === "type") {
            focusField(descriptionRef);
            return;
        }

        if (field === "description") {
            if (form.type === "payment") {
                focusField(amountRef);
            } else {
                focusField(quantityRef);
            }
            return;
        }

        if (field === "quantity") {
            focusField(unitPriceRef);
            return;
        }

        if (field === "unitPrice") {
            focusField(amountRef);
            return;
        }

        if (field === "amount") {
            await handleAdd();
            setTimeout(() => {
                focusField(dateRef);
            }, 50);
        }
    };

    const handleAdd = async () => {
        if (!form.amount || !form.date || !form.type) return;
        if (!data?.account?._id) return;

        const newTransaction = {
            _id: `t${Date.now()}`,
            accountId: data.account._id,
            type: form.type,
            date: form.date,
            description: form.description,
            quantity: Number(form.quantity || 0),
            unitPrice: Number(form.unitPrice || 0),
            amount: Number(form.amount),
        };

        setData((prev) => ({
            ...prev,
            transactions: [newTransaction, ...prev.transactions],
            balance:
                prev.balance +
                (form.type === "debt"
                    ? Number(form.amount)
                    : form.type === "payment"
                        ? -Number(form.amount)
                        : -Number(form.amount)),
        }));

        setForm((prev) => ({
            ...prev,
            date: new Date().toISOString().slice(0, 10),
            description: "",
            quantity: "",
            unitPrice: "",
            amount: "",
        }));
    };

    const startEdit = (t) => {
        setEditingId(t._id);
        setEditForm({
            date: t.date ? new Date(t.date).toISOString().slice(0, 10) : "",
            type: t.type,
            description: t.description || "",
            quantity: t.quantity ?? "",
            unitPrice: t.unitPrice ?? "",
            amount: t.amount ?? "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleEditChange = (field, value) => {
        const next = { ...editForm, [field]: value };

        if (
            (field === "quantity" || field === "unitPrice") &&
            next.type !== "payment"
        ) {
            const q = Number(next.quantity || 0);
            const p = Number(next.unitPrice || 0);
            next.amount = q && p ? q * p : next.amount;
        }

        setEditForm(next);
    };

    const saveEdit = async (transactionId) => {
        setData((prev) => ({
            ...prev,
            transactions: prev.transactions.map((t) =>
                t._id === transactionId ? { ...t, ...editForm } : t
            ),
        }));

        setEditingId(null);
        setEditForm({});
    };

    const handleDelete = async (transactionId) => {
        const confirmed = window.confirm("האם למחוק את השורה?");
        if (!confirmed) return;

        const tx = data.transactions.find((t) => t._id === transactionId);

        setData((prev) => ({
            ...prev,
            transactions: prev.transactions.filter((t) => t._id !== transactionId),
            balance:
                prev.balance -
                (tx?.type === "debt"
                    ? Number(tx.amount || 0)
                    : tx?.type === "payment"
                        ? -Number(tx.amount || 0)
                        : -Number(tx.amount || 0)),
        }));
    };

    const getTypeLabel = (type) => {
        if (type === "debt") return "חוב";
        if (type === "payment") return "תשלום";
        return "החזרה";
    };

    const getTypeColor = (type) => {
        if (type === "debt") return "error";
        if (type === "payment") return "success";
        return "warning";
    };

    const getRowBg = (type) => {
        if (type === "debt") return "#fee2e2";
        if (type === "payment") return "#d1fae5";
        return "#fef3c7";
    };

    const handlePrintAccount = () => {
        if (!data) return;

        const { transactions, balance, account } = data;

        const rowsHtml = transactions
            .map((t) => {
                const typeLabel = getTypeLabel(t.type);

                return `
          <tr>
            <td>${new Date(t.date).toLocaleDateString("he-IL")}</td>
            <td>${typeLabel}</td>
            <td>${t.description || "-"}</td>
            <td>${t.type === "payment" ? "-" : t.quantity || "-"}</td>
            <td>${t.type === "payment" ? "-" : t.unitPrice || "-"}</td>
            <td>${t.amount} ₪</td>
          </tr>
        `;
            })
            .join("");

        const debtsTotal = transactions
            .filter((t) => t.type === "debt")
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const paymentsTotal = transactions
            .filter((t) => t.type === "payment")
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const returnsTotal = transactions
            .filter((t) => t.type === "return")
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const printWindow = window.open("", "_blank", "width=1000,height=800");
        if (!printWindow) return;

        printWindow.document.write(`
      <html dir="rtl" lang="he">
        <head>
          <title>הדפסת חשבון לקוח</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              direction: rtl;
              padding: 24px;
              color: #111;
            }
            .header {
              margin-bottom: 24px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .sub {
              color: #444;
              margin-bottom: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: right;
              font-size: 14px;
            }
            th {
              background: #f5f5f5;
            }
            .summary {
              margin-top: 24px;
              width: 320px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #ddd;
            }
            .balance {
              font-size: 20px;
              font-weight: bold;
              margin-top: 14px;
            }
            .note {
              margin-top: 30px;
              color: #444;
            }
            @media print {
              button { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${settings?.storeName || "חנות"}</div>
            <div class="sub">טלפון: ${settings?.storePhone || "-"}</div>
            <div class="sub">כתובת: ${settings?.storeAddress || "-"}</div>
            <div class="sub" style="margin-top:10px;font-weight:bold;">חשבון לקוח</div>
            <div class="sub">תאריך הדפסה: ${new Date().toLocaleDateString(
            "he-IL"
        )}</div>
            <div class="sub">מספר חשבון: ${account?._id || "-"}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>תאריך</th>
                <th>סוג פעולה</th>
                <th>תיאור / פריט</th>
                <th>כמות</th>
                <th>מחיר</th>
                <th>סכום</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row"><span>סה״כ חובות</span><span>${debtsTotal} ₪</span></div>
            <div class="summary-row"><span>סה״כ תשלומים</span><span>${paymentsTotal} ₪</span></div>
            <div class="summary-row"><span>סה״כ החזרות</span><span>${returnsTotal} ₪</span></div>
            <div class="balance">יתרה נוכחית: ${balance} ₪</div>
          </div>

          ${settings?.footerText
                ? `<div class="note">${settings.footerText}</div>`
                : ""
            }

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

        printWindow.document.close();
    };

    if (!data) {
        return (
            <ThemeProvider theme={theme}>
                <Box
                    sx={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "background.default",
                    }}
                >
                    <Typography variant="h6" color="text.secondary">
                        טוען...
                    </Typography>
                </Box>
            </ThemeProvider>
        );
    }

    const { transactions, balance } = data;

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    minHeight: "100vh",
                    bgcolor: "background.default",
                    py: { xs: 2, sm: 3, md: 4 },
                }}
                dir="rtl"
            >
                <Container maxWidth="xl">
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="h4"
                            sx={{
                                mb: 1,
                                color: "primary.main",
                                fontSize: { xs: "1.5rem", sm: "1.875rem" },
                            }}
                        >
                            חשבון לקוח
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ניהול חשבון ועסקאות
                        </Typography>
                    </Box>

                    <Paper
                        sx={{
                            mb: 3,
                            overflow: "hidden",
                        }}
                    >
                        <Tabs
                            value={tab}
                            onChange={(e, newValue) => setTab(newValue)}
                            sx={{
                                borderBottom: 1,
                                borderColor: "divider",
                                "& .MuiTab-root": {
                                    fontSize: { xs: "0.875rem", sm: "1rem" },
                                    minHeight: { xs: 48, sm: 56 },
                                },
                            }}
                        >
                            <Tab label="חשבון נוכחי" />
                            <Tab label="ארכיון" />
                        </Tabs>
                    </Paper>

                    {tab === 0 && (
                        <>
                            <Paper
                                sx={{
                                    p: { xs: 2, sm: 3 },
                                    mb: 3,
                                    background:
                                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                }}
                            >
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                    spacing={2}
                                >
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "rgba(255,255,255,0.9)", mb: 0.5 }}
                                        >
                                            יתרה נוכחית
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                color: "white",
                                                fontWeight: 700,
                                                fontSize: { xs: "2rem", sm: "2.5rem" },
                                            }}
                                        >
                                            {balance} ₪
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        onClick={handlePrintAccount}
                                        sx={{
                                            bgcolor: "white",
                                            color: "#667eea",
                                            "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                                        }}
                                    >
                                        הדפס חשבון
                                    </Button>
                                </Stack>
                            </Paper>

                            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    הוסף עסקה
                                </Typography>

                                <Stack spacing={2}>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        sx={{ flexWrap: "wrap" }}
                                    >
                                        <TextField
                                            inputRef={dateRef}
                                            label="תאריך"
                                            type="date"
                                            value={form.date}
                                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                                            onKeyDown={(e) => handleQuickEnter(e, "date")}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{
                                                flex: { xs: "1 1 100%", sm: "0 1 auto" },
                                                minWidth: 150,
                                            }}
                                        />

                                        <TextField
                                            select
                                            inputRef={typeRef}
                                            label="סוג פעולה"
                                            value={form.type}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    type: e.target.value,
                                                    description: "",
                                                    quantity: "",
                                                    unitPrice: "",
                                                    amount: "",
                                                })
                                            }
                                            onKeyDown={(e) => handleQuickEnter(e, "type")}
                                            sx={{
                                                flex: { xs: "1 1 100%", sm: "0 1 auto" },
                                                minWidth: 150,
                                            }}
                                        >
                                            <MenuItem value="debt">חוב</MenuItem>
                                            <MenuItem value="payment">תשלום</MenuItem>
                                            <MenuItem value="return">החזרה</MenuItem>
                                        </TextField>

                                        <Autocomplete
                                            freeSolo
                                            options={items}
                                            getOptionLabel={(option) =>
                                                typeof option === "string" ? option : option.name || ""
                                            }
                                            value={form.description}
                                            onInputChange={(event, newInputValue) => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    description: newInputValue,
                                                }));
                                            }}
                                            onChange={(event, newValue) => {
                                                if (!newValue) return;

                                                if (typeof newValue === "string") {
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        description: newValue,
                                                    }));
                                                    return;
                                                }

                                                const quantity = Number(form.quantity || 0);
                                                const unitPrice = Number(newValue.price || 0);
                                                const amount =
                                                    quantity && unitPrice ? quantity * unitPrice : "";

                                                setForm((prev) => ({
                                                    ...prev,
                                                    description: newValue.name,
                                                    unitPrice: unitPrice || "",
                                                    amount,
                                                }));

                                                setTimeout(() => {
                                                    if (form.type === "payment") {
                                                        focusField(amountRef);
                                                    } else {
                                                        focusField(quantityRef);
                                                    }
                                                }, 50);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    inputRef={descriptionRef}
                                                    label={form.type === "payment" ? "תיאור" : "פריט"}
                                                    onKeyDown={(e) => handleQuickEnter(e, "description")}
                                                />
                                            )}
                                            sx={{ flex: { xs: "1 1 100%", sm: "1 1 220px" } }}
                                        />

                                        {form.type !== "payment" && (
                                            <TextField
                                                inputRef={quantityRef}
                                                label="כמות"
                                                type="number"
                                                value={form.quantity}
                                                onChange={(e) => {
                                                    const quantity = e.target.value;
                                                    const unitPrice = form.unitPrice || "";
                                                    const amount =
                                                        quantity && unitPrice
                                                            ? Number(quantity) * Number(unitPrice)
                                                            : "";
                                                    setForm({
                                                        ...form,
                                                        quantity,
                                                        amount: amount.toString(),
                                                    });
                                                }}
                                                onKeyDown={(e) => handleQuickEnter(e, "quantity")}
                                                sx={{ flex: { xs: "1 1 100%", sm: "0 1 100px" } }}
                                            />
                                        )}

                                        {form.type !== "payment" && (
                                            <TextField
                                                inputRef={unitPriceRef}
                                                label="מחיר"
                                                type="number"
                                                value={form.unitPrice}
                                                onChange={(e) => {
                                                    const unitPrice = e.target.value;
                                                    const quantity = form.quantity || "";
                                                    const amount =
                                                        quantity && unitPrice
                                                            ? Number(quantity) * Number(unitPrice)
                                                            : "";
                                                    setForm({
                                                        ...form,
                                                        unitPrice,
                                                        amount: amount.toString(),
                                                    });
                                                }}
                                                onKeyDown={(e) => handleQuickEnter(e, "unitPrice")}
                                                sx={{ flex: { xs: "1 1 100%", sm: "0 1 120px" } }}
                                            />
                                        )}

                                        <TextField
                                            inputRef={amountRef}
                                            label="סכום"
                                            type="number"
                                            value={form.amount}
                                            onChange={(e) =>
                                                setForm({ ...form, amount: e.target.value })
                                            }
                                            onKeyDown={(e) => handleQuickEnter(e, "amount")}
                                            sx={{ flex: { xs: "1 1 100%", sm: "0 1 120px" } }}
                                        />

                                        <Button
                                            variant="contained"
                                            onClick={handleAdd}
                                            sx={{
                                                flex: { xs: "1 1 100%", sm: "0 1 auto" },
                                                minHeight: 56,
                                            }}
                                        >
                                            הוסף
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Paper>

                            <TableContainer
                                component={Paper}
                                sx={{
                                    overflowX: "auto",
                                }}
                            >
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "grey.50" }}>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                תאריך
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                סוג פעולה
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                תיאור / פריט
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 600,
                                                    display: { xs: "none", sm: "table-cell" },
                                                }}
                                            >
                                                כמות
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 600,
                                                    display: { xs: "none", sm: "table-cell" },
                                                }}
                                            >
                                                מחיר
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                סכום
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                פעולות
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {transactions.map((t) => {
                                            const isEditing = editingId === t._id;

                                            return (
                                                <TableRow
                                                    key={t._id}
                                                    sx={{
                                                        backgroundColor: getRowBg(t.type),
                                                        "&:hover": { opacity: 0.9 },
                                                    }}
                                                >
                                                    <TableCell align="right">
                                                        {isEditing ? (
                                                            <TextField
                                                                type="date"
                                                                value={editForm.date || ""}
                                                                onChange={(e) =>
                                                                    handleEditChange("date", e.target.value)
                                                                }
                                                                InputLabelProps={{ shrink: true }}
                                                                size="small"
                                                            />
                                                        ) : (
                                                            new Date(t.date).toLocaleDateString("he-IL")
                                                        )}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        {isEditing ? (
                                                            <TextField
                                                                select
                                                                size="small"
                                                                value={editForm.type || ""}
                                                                onChange={(e) =>
                                                                    handleEditChange("type", e.target.value)
                                                                }
                                                                sx={{ minWidth: 120 }}
                                                            >
                                                                <MenuItem value="debt">חוב</MenuItem>
                                                                <MenuItem value="payment">תשלום</MenuItem>
                                                                <MenuItem value="return">החזרה</MenuItem>
                                                            </TextField>
                                                        ) : (
                                                            <Chip
                                                                label={getTypeLabel(t.type)}
                                                                color={getTypeColor(t.type)}
                                                                size="small"
                                                            />
                                                        )}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        {isEditing ? (
                                                            <TextField
                                                                size="small"
                                                                value={editForm.description || ""}
                                                                onChange={(e) =>
                                                                    handleEditChange("description", e.target.value)
                                                                }
                                                            />
                                                        ) : (
                                                            t.description || "-"
                                                        )}
                                                    </TableCell>

                                                    <TableCell
                                                        align="right"
                                                        sx={{ display: { xs: "none", sm: "table-cell" } }}
                                                    >
                                                        {isEditing ? (
                                                            editForm.type !== "payment" ? (
                                                                <TextField
                                                                    type="number"
                                                                    size="small"
                                                                    value={editForm.quantity || ""}
                                                                    onChange={(e) =>
                                                                        handleEditChange("quantity", e.target.value)
                                                                    }
                                                                    sx={{ width: 90 }}
                                                                />
                                                            ) : (
                                                                "-"
                                                            )
                                                        ) : t.type === "payment" ? (
                                                            "-"
                                                        ) : (
                                                            t.quantity || "-"
                                                        )}
                                                    </TableCell>

                                                    <TableCell
                                                        align="right"
                                                        sx={{ display: { xs: "none", sm: "table-cell" } }}
                                                    >
                                                        {isEditing ? (
                                                            editForm.type !== "payment" ? (
                                                                <TextField
                                                                    type="number"
                                                                    size="small"
                                                                    value={editForm.unitPrice || ""}
                                                                    onChange={(e) =>
                                                                        handleEditChange("unitPrice", e.target.value)
                                                                    }
                                                                    sx={{ width: 100 }}
                                                                />
                                                            ) : (
                                                                "-"
                                                            )
                                                        ) : t.type === "payment" ? (
                                                            "-"
                                                        ) : (
                                                            t.unitPrice || "-"
                                                        )}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        {isEditing ? (
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={editForm.amount || ""}
                                                                onChange={(e) =>
                                                                    handleEditChange("amount", e.target.value)
                                                                }
                                                                sx={{ width: 110 }}
                                                            />
                                                        ) : (
                                                            <Typography sx={{ fontWeight: 600 }}>
                                                                {t.amount} ₪
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        {isEditing ? (
                                                            <Stack
                                                                direction={{ xs: "column", sm: "row" }}
                                                                spacing={1}
                                                                justifyContent="flex-end"
                                                            >
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    onClick={() => saveEdit(t._id)}
                                                                >
                                                                    שמור
                                                                </Button>
                                                                <Button size="small" onClick={cancelEdit}>
                                                                    ביטול
                                                                </Button>
                                                            </Stack>
                                                        ) : (
                                                            <Stack
                                                                direction={{ xs: "column", sm: "row" }}
                                                                spacing={1}
                                                                justifyContent="flex-end"
                                                            >
                                                                <Button size="small" onClick={() => startEdit(t)}>
                                                                    עריכה
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDelete(t._id)}
                                                                >
                                                                    מחיקה
                                                                </Button>
                                                            </Stack>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                    {tab === 1 && (
                        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                ארכיון חשבונות
                            </Typography>

                            {archivedAccounts.length === 0 ? (
                                <Box
                                    sx={{
                                        py: 8,
                                        textAlign: "center",
                                        color: "text.secondary",
                                    }}
                                >
                                    <Typography>אין חשבונות בארכיון.</Typography>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align="right">תאריך פתיחה</TableCell>
                                                <TableCell align="right">תאריך ארכוב</TableCell>
                                                <TableCell align="right">סה״כ חובות</TableCell>
                                                <TableCell align="right">סה״כ תשלומים</TableCell>
                                                <TableCell align="right">סה״כ החזרות</TableCell>
                                                <TableCell align="right">מאזן סופי</TableCell>
                                                <TableCell align="right">שורות</TableCell>
                                                <TableCell align="right">פעולות</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {archivedAccounts.map((item) => (
                                                <TableRow key={item.account._id}>
                                                    <TableCell align="right">
                                                        {item.account.openedAt
                                                            ? new Date(item.account.openedAt).toLocaleDateString(
                                                                "he-IL"
                                                            )
                                                            : "-"}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        {item.account.archivedAt
                                                            ? new Date(
                                                                item.account.archivedAt
                                                            ).toLocaleDateString("he-IL")
                                                            : "-"}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        {item.debtsTotal} ₪
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {item.paymentsTotal} ₪
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {item.returnsTotal} ₪
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {item.finalBalance} ₪
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {item.transactionsCount}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => {
                                                                setSelectedArchivedAccount(item);
                                                                setArchiveDialogOpen(true);
                                                            }}
                                                        >
                                                            הצג
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    )}

                    <Dialog
                        open={archiveDialogOpen}
                        onClose={() => setArchiveDialogOpen(false)}
                        maxWidth="lg"
                        fullWidth
                    >
                        <DialogTitle>פרטי חשבון בארכיון</DialogTitle>

                        <DialogContent dividers>
                            {selectedArchivedAccount ? (
                                <>
                                    <Typography sx={{ mb: 2, fontWeight: 600 }}>
                                        יתרה סופית:{" "}
                                        {selectedArchivedAccount.balance ||
                                            selectedArchivedAccount.finalBalance ||
                                            0}{" "}
                                        ₪
                                    </Typography>

                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align="right">תאריך</TableCell>
                                                    <TableCell align="right">סוג פעולה</TableCell>
                                                    <TableCell align="right">תיאור / פריט</TableCell>
                                                    <TableCell align="right">כמות</TableCell>
                                                    <TableCell align="right">מחיר</TableCell>
                                                    <TableCell align="right">סכום</TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {selectedArchivedAccount.transactions?.map((t) => (
                                                    <TableRow key={t._id}>
                                                        <TableCell align="right">
                                                            {new Date(t.date).toLocaleDateString("he-IL")}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {getTypeLabel(t.type)}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {t.description || "-"}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {t.type === "payment" ? "-" : t.quantity || "-"}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {t.type === "payment" ? "-" : t.unitPrice || "-"}
                                                        </TableCell>
                                                        <TableCell align="right">{t.amount} ₪</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            ) : null}
                        </DialogContent>
                    </Dialog>
                </Container>
            </Box>
        </ThemeProvider>
    );
}