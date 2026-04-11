import { useEffect, useState } from "react";
import {
    Box,
    Paper,
    InputBase,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    ClickAwayListener,
    CircularProgress,
    IconButton,
    Stack,
    Chip,
    alpha,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

function getTransactionLabel(type) {
    if (type === "debt") return "חוב";
    if (type === "payment") return "תשלום";
    if (type === "return") return "החזרה";
    return type;
}

function getTransactionChipColor(type) {
    if (type === "debt") return "error";
    if (type === "payment") return "success";
    if (type === "return") return "warning";
    return "default";
}

function SectionHeader({ title, count }) {
    return (
        <Box
            sx={{
                px: 2,
                py: 1.25,
                bgcolor: "grey.50",
                borderBottom: "1px solid",
                borderColor: "divider",
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={800} color="text.secondary">
                    {title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {count}
                </Typography>
            </Stack>
        </Box>
    );
}

export default function GlobalSearch() {
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({
        customers: [],
        transactions: [],
    });
    const [activeIndex, setActiveIndex] = useState(-1);
    const flatResults = [
        ...results.customers.map((c) => ({
            type: "customer",
            data: c,
        })),
        ...results.transactions.map((t) => ({
            type: "transaction",
            data: t,
        })),
    ];
    useEffect(() => {
        const trimmed = query.trim();
        setActiveIndex(-1);
        if (!trimmed) {
            setResults({ customers: [], transactions: [] });
            setLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);

                const { data } = await api.get(
                    `/search/global?q=${encodeURIComponent(trimmed)}`
                );

                setResults({
                    customers: data.customers || [],
                    transactions: data.transactions || [],
                });

                setOpen(true);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!open || !flatResults.length) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) =>
                    prev < flatResults.length - 1 ? prev + 1 : 0
                );
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) =>
                    prev > 0 ? prev - 1 : flatResults.length - 1
                );
            }

            if (e.key === "Enter") {
                e.preventDefault();

                const selected = flatResults[activeIndex];
                if (!selected) return;

                if (selected.type === "customer") {
                    navigate(`/account/${selected.data._id}`);
                } else {
                    if (selected.data.customerId) {
                        navigate(`/account/${selected.data.customerId}`);
                    }
                }

                handleClear();
            }

            if (e.key === "Escape") {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, flatResults, activeIndex]);
    const hasResults =
        results.customers.length > 0 || results.transactions.length > 0;

    const handleClose = () => setOpen(false);

    const handleClear = () => {
        setQuery("");
        setResults({ customers: [], transactions: [] });
        setOpen(false);
    };

    return (
        <ClickAwayListener onClickAway={handleClose}>
            <Box
                sx={{
                    position: "relative",
                    width: { xs: "100%", md: 430 },
                    maxWidth: "100%",
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        border: "1px solid",
                        borderColor: open ? "primary.main" : "divider",
                        bgcolor: "#fff",
                        boxShadow: open ? 4 : 0,
                        transition: "all 0.2s ease",
                    }}
                >
                    <SearchRoundedIcon color="action" />

                    <InputBase
                        fullWidth
                        placeholder="חיפוש לקוחות, טלפון או תנועות..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => {
                            if (query.trim()) setOpen(true);
                        }}
                        sx={{
                            fontSize: 15,
                        }}
                    />

                    {loading && <CircularProgress size={18} />}

                    {!loading && query && (
                        <IconButton size="small" onClick={handleClear}>
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    )}
                </Paper>

                {open && query.trim() && (
                    <Paper
                        elevation={8}
                        sx={{
                            mt: 1,
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            left: 0,
                            zIndex: 30,
                            borderRadius: 3,
                            overflow: "hidden",
                            maxHeight: 460,
                            overflowY: "auto",
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "#fff",
                        }}
                    >
                        {!loading && !hasResults ? (
                            <Box
                                sx={{
                                    p: 3,
                                    textAlign: "center",
                                }}
                            >
                                <SearchRoundedIcon
                                    sx={{
                                        fontSize: 34,
                                        color: "text.disabled",
                                        mb: 1,
                                    }}
                                />
                                <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                                    לא נמצאו תוצאות
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    נסה לחפש לפי שם לקוח, טלפון, תיאור או הערה
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                {results.customers.length > 0 && (
                                    <>
                                        <SectionHeader
                                            title="לקוחות"
                                            count={results.customers.length}
                                        />

                                        <List disablePadding>
                                            {results.customers.map((customer) => (
                                                <ListItemButton
                                                    key={customer._id}
                                                    selected={flatResults[activeIndex]?.data?._id === customer._id}
                                                    onClick={() => {
                                                        navigate(`/account/${customer._id}`);
                                                        handleClear();
                                                    }}
                                                    sx={{
                                                        py: 1.25,
                                                        px: 1.5,
                                                        bgcolor:
                                                            flatResults[activeIndex]?.data?._id === customer._id
                                                                ? alpha("#1976d2", 0.1)
                                                                : undefined,
                                                        "&:hover": {
                                                            bgcolor: alpha("#1976d2", 0.05),
                                                        },
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            ml: 1.5,
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius: 2,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            bgcolor: (theme) =>
                                                                alpha(theme.palette.primary.main, 0.1),
                                                            color: "primary.main",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <PersonRoundedIcon fontSize="small" />
                                                    </Box>

                                                    <ListItemText
                                                        primary={
                                                            <Typography fontWeight={700}>
                                                                {customer.fullName}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            customer.phone || "ללא מספר טלפון"
                                                        }
                                                    />
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    </>
                                )}

                                {results.customers.length > 0 &&
                                    results.transactions.length > 0 && <Divider />}

                                {results.transactions.length > 0 && (
                                    <>
                                        <SectionHeader
                                            title="תנועות"
                                            count={results.transactions.length}
                                        />

                                        <List disablePadding>
                                            {results.transactions.map((tx) => (
                                                <ListItemButton
                                                    key={tx._id}
                                                    selected={flatResults[activeIndex]?.data?._id === tx._id}
                                                    onClick={() => {
                                                        if (tx.customerId) {
                                                            navigate(`/account/${tx.customerId}`);
                                                            handleClear();
                                                        }
                                                    }}
                                                    sx={{
                                                        py: 1.25,
                                                        px: 1.5,
                                                        alignItems: "flex-start",
                                                        bgcolor:
                                                            flatResults[activeIndex]?.data?._id === tx._id
                                                                ? alpha("#1976d2", 0.1)
                                                                : undefined,
                                                        "&:hover": {
                                                            bgcolor: alpha("#1976d2", 0.05),
                                                        },
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            ml: 1.5,
                                                            mt: 0.25,
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius: 2,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            bgcolor: "grey.100",
                                                            color: "text.secondary",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <ReceiptLongRoundedIcon fontSize="small" />
                                                    </Box>

                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Stack
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                            spacing={1}
                                                            sx={{ mb: 0.5 }}
                                                        >
                                                            <Typography
                                                                fontWeight={700}
                                                                noWrap
                                                                sx={{ minWidth: 0 }}
                                                            >
                                                                {tx.customerName}
                                                            </Typography>

                                                            <Chip
                                                                label={getTransactionLabel(tx.type)}
                                                                size="small"
                                                                color={getTransactionChipColor(tx.type)}
                                                                variant="outlined"
                                                            />
                                                        </Stack>

                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mb: 0.5 }}
                                                            noWrap
                                                        >
                                                            {tx.description || "ללא תיאור"}
                                                        </Typography>

                                                        <Stack
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                            spacing={1}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {new Date(tx.date).toLocaleDateString("he-IL")}
                                                            </Typography>

                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={800}
                                                                sx={{
                                                                    color:
                                                                        tx.type === "debt"
                                                                            ? "error.main"
                                                                            : tx.type === "payment"
                                                                                ? "success.main"
                                                                                : "warning.main",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                {Number(tx.amount || 0).toLocaleString()} ₪
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    </>
                                )}
                            </>
                        )}
                    </Paper>
                )}
            </Box>
        </ClickAwayListener>
    );
}