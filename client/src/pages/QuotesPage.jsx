import { useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Stack,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Autocomplete,
    Grid,
    Chip,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

const customerFilter = createFilterOptions();

function normalizeCustomerOption(option) {
    if (typeof option === "string") {
        return {
            inputValue: option,
            fullName: option,
            phone: "",
            isNew: true,
        };
    }

    return option;
}

export default function QuotesPage() {
    const [quotes, setQuotes] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [settings, setSettings] = useState(null);
    const navigate = useNavigate();

    const [quoteInfo, setQuoteInfo] = useState({
        customer: null,
        customerName: "",
        customerPhone: "",
        date: new Date().toISOString().slice(0, 10),
        note: "",
    });

    const [rows, setRows] = useState([
        {
            id: crypto.randomUUID(),
            date: new Date().toISOString().slice(0, 10),
            description: "",
            quantity: "",
            unitPrice: "",
            amount: "",
            item: null,
        },
    ]);

    const descriptionRef = useRef(null);

    const selectedCustomer =
        customers.find((c) => c._id === quoteInfo.customer) || null;

    const fetchSettings = async () => {
        const res = await api.get("/settings");
        setSettings(res.data);
    };

    const fetchQuotes = async () => {
        const res = await api.get("/quotes");
        setQuotes(res.data);
    };

    const fetchCustomers = async () => {
        const res = await api.get("/customers");
        setCustomers(res.data);
    };

    const fetchItems = async () => {
        const res = await api.get("/items");
        setItems(res.data);
    };

    useEffect(() => {
        fetchQuotes();
        fetchCustomers();
        fetchItems();
        fetchSettings();
    }, []);

    const total = useMemo(() => {
        return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    }, [rows]);

    const updateRow = (id, patch) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;

                const next = { ...row, ...patch };

                const q = Number(next.quantity || 0);
                const p = Number(next.unitPrice || 0);
                next.amount = q && p ? q * p : next.amount;

                return next;
            })
        );
    };

    const addRow = () => {
        setRows((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                date: quoteInfo.date,
                description: "",
                quantity: "",
                unitPrice: "",
                amount: "",
                item: null,
            },
        ]);
    };

    const removeRow = (id) => {
        if (rows.length === 1) return;
        setRows((prev) => prev.filter((row) => row.id !== id));
    };

    const handleCustomerChange = (newValue) => {
        if (!newValue) {
            setQuoteInfo((prev) => ({
                ...prev,
                customer: null,
                customerName: "",
                customerPhone: "",
            }));
            return;
        }

        if (typeof newValue === "string") {
            setQuoteInfo((prev) => ({
                ...prev,
                customer: null,
                customerName: newValue,
            }));
            return;
        }

        if (newValue.isNew) {
            setQuoteInfo((prev) => ({
                ...prev,
                customer: null,
                customerName: newValue.fullName || newValue.inputValue || "",
            }));
            return;
        }

        setQuoteInfo((prev) => ({
            ...prev,
            customer: newValue._id,
            customerName: newValue.fullName || "",
            customerPhone: newValue.phone || "",
        }));
    };

    const handleCustomerInputChange = (newInputValue) => {
        setQuoteInfo((prev) => ({
            ...prev,
            customer: null,
            customerName: newInputValue,
        }));
    };

    const handleSaveQuote = async () => {
        const validRows = rows.filter(
            (row) => row.description && Number(row.amount || 0) > 0
        );

        if (validRows.length === 0) {
            alert("יש להוסיף לפחות שורה אחת תקינה.");
            return;
        }

        if (!quoteInfo.customerName.trim()) {
            alert("יש להזין שם לקוח.");
            return;
        }

        await api.post("/quotes", {
            customer: quoteInfo.customer || null,
            customerName: quoteInfo.customerName,
            customerPhone: quoteInfo.customerPhone,
            date: quoteInfo.date,
            note: quoteInfo.note,
            items: validRows.map((row) => ({
                date: row.date,
                description: row.description,
                quantity: Number(row.quantity || 0),
                unitPrice: Number(row.unitPrice || 0),
                amount: Number(row.amount || 0),
                item: row.item || null,
            })),
        });

        setQuoteInfo({
            customer: null,
            customerName: "",
            customerPhone: "",
            date: new Date().toISOString().slice(0, 10),
            note: "",
        });

        setRows([
            {
                id: crypto.randomUUID(),
                date: new Date().toISOString().slice(0, 10),
                description: "",
                quantity: "",
                unitPrice: "",
                amount: "",
                item: null,
            },
        ]);

        fetchQuotes();

        setTimeout(() => {
            descriptionRef.current?.focus?.();
        }, 50);
    };

    const handleConvertQuote = async (quote) => {
        try {
            const res = await api.post(`/quotes/${quote._id}/convert`);

            alert(res.data.message || "הצעת המחיר הומרה לחשבון בהצלחה.");

            fetchQuotes();

            if (res.data.customerId) {
                navigate(`/account/${res.data.customerId}`);
            }
        } catch (error) {
            alert(
                error?.response?.data?.message ||
                "אירעה שגיאה בהמרת הצעת המחיר לחשבון."
            );
        }
    };

    const handlePrintQuote = async (quoteSummary) => {
        const res = await api.get(`/quotes/${quoteSummary._id}`);
        const quote = res.data;

        const rowsHtml = quote.items
            .map((item) => {
                return `
        <tr>
          <td>${new Date(item.date).toLocaleDateString("he-IL")}</td>
          <td>${item.description || "-"}</td>
          <td>${item.quantity || "-"}</td>
          <td>${item.unitPrice || "-"}</td>
          <td>${item.amount} ₪</td>
        </tr>
      `;
            })
            .join("");

        const printWindow = window.open("", "_blank", "width=1000,height=800");

        if (!printWindow) return;

        printWindow.document.write(`
    <html dir="rtl" lang="he">
      <head>
        <title>הצעת מחיר</title>
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
          .total {
            margin-top: 24px;
            font-size: 22px;
            font-weight: bold;
          }
          .note {
            margin-top: 20px;
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
          <div class="title">${settings?.storeName || "Yasmine Ledger"}</div>
          <div class="sub">טלפון: ${settings?.storePhone || "-"}</div>
          <div class="sub">כתובת: ${settings?.storeAddress || "-"}</div>
          <div class="sub" style="margin-top:10px;font-weight:bold;">הצעת מחיר</div>
          <div class="sub">מספר הצעה: ${quote.quoteNumber}</div>
          <div class="sub">תאריך: ${new Date(quote.date).toLocaleDateString("he-IL")}</div>
          <div class="sub">לקוח: ${quote.customerName || quote.customer?.fullName || "-"}</div>
          <div class="sub">טלפון: ${quote.customerPhone || quote.customer?.phone || "-"}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>תאריך</th>
              <th>פריט / תיאור</th>
              <th>כמות</th>
              <th>מחיר</th>
              <th>סכום</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="total">סה״כ: ${quote.total} ₪</div>

        ${quote.note
                ? `<div class="note"><strong>הערה:</strong> ${quote.note}</div>`
                : ""
            }

        <div class="note" style="margin-top:30px;">
          הצעה זו אינה חשבונית.
        </div>

        ${settings?.footerText ? `<div class="note">${settings.footerText}</div>` : ""}

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

    return (
        <Box p={3}>
            <Typography variant="h4" mb={3}>
                הצעות מחיר
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                        <Autocomplete
                            freeSolo
                            selectOnFocus
                            clearOnBlur={false}
                            handleHomeEndKeys
                            options={customers}
                            value={selectedCustomer}
                            inputValue={quoteInfo.customerName}
                            onChange={(event, newValue) => handleCustomerChange(newValue)}
                            onInputChange={(event, newInputValue, reason) => {
                                if (reason === "input") {
                                    handleCustomerInputChange(newInputValue);
                                }

                                if (reason === "clear") {
                                    setQuoteInfo((prev) => ({
                                        ...prev,
                                        customer: null,
                                        customerName: "",
                                        customerPhone: "",
                                    }));
                                }
                            }}
                            getOptionLabel={(option) => {
                                if (typeof option === "string") return option;
                                if (option.isNew) return option.fullName || option.inputValue || "";
                                return option.fullName || "";
                            }}
                            isOptionEqualToValue={(option, value) => option._id === value._id}
                            filterOptions={(options, params) => {
                                const filtered = customerFilter(options, params);
                                const inputValue = params.inputValue.trim();

                                if (!inputValue) return filtered;

                                const exists = options.some((option) => {
                                    const name = option.fullName?.toLowerCase() || "";
                                    const phone = option.phone?.toLowerCase() || "";
                                    const q = inputValue.toLowerCase();
                                    return name === q || phone === q;
                                });

                                if (!exists) {
                                    filtered.push({
                                        inputValue,
                                        fullName: inputValue,
                                        phone: "",
                                        isNew: true,
                                    });
                                }

                                return filtered;
                            }}
                            renderOption={(props, option) => {
                                const normalized = normalizeCustomerOption(option);

                                if (normalized.isNew) {
                                    return (
                                        <Box component="li" {...props}>
                                            <Stack spacing={0.25}>
                                                <Typography fontWeight={700} color="primary.main">
                                                    צור לקוח חדש: {normalized.fullName || normalized.inputValue}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    הלקוח יישמר בהצעת המחיר וייווצר בעת המרה לחשבון
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    );
                                }

                                return (
                                    <Box component="li" {...props}>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            sx={{ width: "100%" }}
                                            spacing={2}
                                        >
                                            <Box>
                                                <Typography fontWeight={700}>{normalized.fullName}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {normalized.phone || "ללא טלפון"}
                                                </Typography>
                                            </Box>

                                            <Chip label="לקוח קיים" size="small" variant="outlined" />
                                        </Stack>
                                    </Box>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="לקוח"
                                    placeholder="חפש לקוח קיים או הזן לקוח חדש"
                                    sx={{ minWidth: 300 }}
                                    helperText={
                                        quoteInfo.customer
                                            ? "נבחר לקוח קיים מהרשימה"
                                            : "אפשר לבחור לקוח קיים או ליצור לקוח חדש"
                                    }
                                />
                            )}
                        />

                        <TextField
                            label="טלפון"
                            value={quoteInfo.customerPhone}
                            onChange={(e) =>
                                setQuoteInfo((prev) => ({
                                    ...prev,
                                    customerPhone: e.target.value,
                                }))
                            }
                            sx={{ minWidth: 180 }}
                        />

                        <TextField
                            label="תאריך"
                            type="date"
                            value={quoteInfo.date}
                            onChange={(e) =>
                                setQuoteInfo((prev) => ({
                                    ...prev,
                                    date: e.target.value,
                                }))
                            }
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 160 }}
                        />
                    </Stack>

                    {!quoteInfo.customer && quoteInfo.customerName.trim() && (
                        <Box>
                            <Chip
                                label="לקוח חדש ייווצר אוטומטית בעת המרה לחשבון"
                                color="info"
                                variant="outlined"
                            />
                        </Box>
                    )}

                    <TextField
                        label="הערה"
                        value={quoteInfo.note}
                        onChange={(e) =>
                            setQuoteInfo((prev) => ({ ...prev, note: e.target.value }))
                        }
                        fullWidth
                    />
                </Stack>
            </Paper>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="right">תאריך</TableCell>
                            <TableCell align="right">פריט / תיאור</TableCell>
                            <TableCell align="right">כמות</TableCell>
                            <TableCell align="right">מחיר</TableCell>
                            <TableCell align="right">סכום</TableCell>
                            <TableCell align="right">פעולות</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell align="right">
                                    <TextField
                                        type="date"
                                        value={row.date}
                                        onChange={(e) => updateRow(row.id, { date: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                    />
                                </TableCell>

                                <TableCell align="right" sx={{ minWidth: 260 }}>
                                    <Autocomplete
                                        freeSolo
                                        options={items}
                                        getOptionLabel={(option) =>
                                            typeof option === "string" ? option : option.name || ""
                                        }
                                        value={row.description}
                                        onInputChange={(event, newInputValue) => {
                                            updateRow(row.id, { description: newInputValue });
                                        }}
                                        onChange={(event, newValue) => {
                                            if (!newValue) return;

                                            if (typeof newValue === "string") {
                                                updateRow(row.id, {
                                                    description: newValue,
                                                    item: null,
                                                });
                                                return;
                                            }

                                            updateRow(row.id, {
                                                description: newValue.name,
                                                unitPrice: Number(newValue.price || 0),
                                                item: newValue._id,
                                            });
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                inputRef={descriptionRef}
                                                label="פריט / תיאור"
                                                size="small"
                                            />
                                        )}
                                    />
                                </TableCell>

                                <TableCell align="right">
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={row.quantity}
                                        onChange={(e) =>
                                            updateRow(row.id, { quantity: e.target.value })
                                        }
                                        sx={{ width: 90 }}
                                    />
                                </TableCell>

                                <TableCell align="right">
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={row.unitPrice}
                                        onChange={(e) =>
                                            updateRow(row.id, { unitPrice: e.target.value })
                                        }
                                        sx={{ width: 110 }}
                                    />
                                </TableCell>

                                <TableCell align="right">
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={row.amount}
                                        onChange={(e) =>
                                            updateRow(row.id, { amount: e.target.value })
                                        }
                                        sx={{ width: 110 }}
                                    />
                                </TableCell>

                                <TableCell align="right">
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        justifyContent="flex-end"
                                        sx={{ width: "100%" }}
                                    >
                                        <Button size="small" onClick={addRow}>
                                            הוסף שורה
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={() => removeRow(row.id)}
                                        >
                                            מחק
                                        </Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    useFlexGap
                    flexWrap="wrap"
                >
                    <Typography variant="h6">סה״כ: {total} ₪</Typography>

                    <Button variant="contained" onClick={handleSaveQuote}>
                        שמור הצעת מחיר
                    </Button>
                </Stack>
            </Paper>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h5" mb={2} fontWeight={800}>
                הצעות אחרונות
            </Typography>

            {quotes.length === 0 ? (
                <Paper
                    sx={{
                        p: 4,
                        textAlign: "center",
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="h6" fontWeight={700} mb={1}>
                        אין עדיין הצעות מחיר
                    </Typography>
                    <Typography color="text.secondary">
                        לאחר שמירת הצעת מחיר, היא תופיע כאן.
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {quotes.map((quote) => {
                        const isConverted = quote.status === "converted";
                        const customerLabel =
                            quote.customerName || quote.customer?.fullName || "-";

                        return (
                            <Grid item xs={12} md={6} lg={4} key={quote._id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        height: "100%",
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        gap: 2,
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            boxShadow: 4,
                                            transform: "translateY(-2px)",
                                        },
                                    }}
                                >
                                    <Stack spacing={1.25}>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="flex-start"
                                            spacing={1}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    variant="subtitle1"
                                                    fontWeight={800}
                                                    sx={{ lineHeight: 1.2 }}
                                                >
                                                    {quote.quoteNumber}
                                                </Typography>

                                                <Typography
                                                    variant="body1"
                                                    fontWeight={600}
                                                    noWrap
                                                    sx={{ mt: 0.5 }}
                                                >
                                                    {customerLabel}
                                                </Typography>
                                            </Box>

                                            <Chip
                                                label={isConverted ? "הומר לחשבון" : "טיוטה"}
                                                color={isConverted ? "success" : "default"}
                                                variant={isConverted ? "filled" : "outlined"}
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </Stack>

                                        <Stack spacing={0.75}>
                                            <Typography variant="body2" color="text.secondary">
                                                תאריך: {new Date(quote.date).toLocaleDateString("he-IL")}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary">
                                                טלפון: {quote.customerPhone || quote.customer?.phone || "-"}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary">
                                                מספר פריטים: {quote.items?.length || 0}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary">
                                                סה״כ: <strong>{Number(quote.total || 0).toLocaleString()} ₪</strong>
                                            </Typography>

                                            {quote.status === "converted" && quote.convertedAt && (
                                                <Typography variant="body2" color="success.main" fontWeight={600}>
                                                    הומר בתאריך: {new Date(quote.convertedAt).toLocaleDateString("he-IL")}
                                                </Typography>
                                            )}

                                            {!quote.customer && quote.customerName && (
                                                <Typography variant="body2" color="info.main" fontWeight={600}>
                                                    לקוח חדש / לא מקושר עדיין
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Stack>

                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={1}
                                        justifyContent="flex-end"
                                    >
                                        <Button
                                            variant="outlined"
                                            onClick={() => handlePrintQuote(quote)}
                                            fullWidth
                                        >
                                            הדפס
                                        </Button>

                                        {isConverted ? (
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={() =>
                                                    navigate(`/account/${quote.customer?._id || quote.customer}`)
                                                }
                                                disabled={!quote.customer}
                                                fullWidth
                                            >
                                                פתח חשבון
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                onClick={() => handleConvertQuote(quote)}
                                                disabled={
                                                    !quote.items?.length ||
                                                    !(quote.customer || quote.customerName?.trim())
                                                }
                                                fullWidth
                                            >
                                                המר לחשבון
                                            </Button>
                                        )}
                                    </Stack>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
}