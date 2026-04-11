import { useEffect, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Grid,
    Stack,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    Skeleton,
    alpha,
} from "@mui/material";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

function StatCard({
    title,
    value,
    subtitle,
    icon,
    color = "primary.main",
    bg,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 4,
                p: 2.25,
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                background: bg || "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                transition: "0.2s ease",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                },
            }}
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={2}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1, fontWeight: 600 }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{ lineHeight: 1.1, mb: 0.75 }}
                    >
                        {value}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color,
                        bgcolor: alpha("#1976d2", 0.08),
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
            </Stack>
        </Paper>
    );
}

function QuickActionCard({ title, subtitle, icon, onClick }) {
    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                borderRadius: 3,
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                cursor: "pointer",
                transition: "0.2s ease",
                background: "#fff",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                    borderColor: "primary.main",
                },
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                    sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
}

function SectionCard({ title, icon, children }) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                p: 2.25,
                height: "100%",
                background: "#fff",
            }}
        >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Box
                    sx={{
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    {icon}
                </Box>
                <Typography variant="h6" fontWeight={800}>
                    {title}
                </Typography>
            </Stack>

            {children}
        </Paper>
    );
}

function LoadingCards() {
    return (
        <Grid container spacing={2}>
            {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} sm={6} lg={3} key={item}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            p: 2.25,
                            border: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        <Skeleton width="40%" height={24} />
                        <Skeleton width="70%" height={46} sx={{ mt: 1 }} />
                        <Skeleton width="60%" height={20} />
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
}

function LoadingSection({ lines = 5 }) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                p: 2.25,
            }}
        >
            <Skeleton width="35%" height={30} sx={{ mb: 2 }} />
            {Array.from({ length: lines }).map((_, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                    <Skeleton width="55%" height={24} />
                    <Skeleton width="35%" height={18} />
                </Box>
            ))}
        </Paper>
    );
}

function EmptyState({ title, subtitle }) {
    return (
        <Box
            sx={{
                py: 5,
                textAlign: "center",
                color: "text.secondary",
            }}
        >
            <Typography fontWeight={700} sx={{ mb: 0.75 }}>
                {title}
            </Typography>
            <Typography variant="body2">{subtitle}</Typography>
        </Box>
    );
}

function getTransactionLabel(type) {
    if (type === "debt") return "חוב";
    if (type === "payment") return "תשלום";
    if (type === "return") return "החזרה";
    return type;
}

function getTransactionPrefix(type) {
    if (type === "debt") return "+";
    if (type === "payment") return "-";
    if (type === "return") return "-";
    return "";
}

function getTransactionColor(type) {
    if (type === "debt") return "error.main";
    if (type === "payment") return "success.main";
    if (type === "return") return "warning.main";
    return "text.primary";
}

export default function Dashboard() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDebt: 0,
        customersInDebtCount: 0,
        archivedAccountsCount: 0,
        todayTransactionsCount: 0,
        latestTransactions: [],
        topDebtors: [],
    });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/dashboard/stats");
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#f5f7fb",
                p: { xs: 2, md: 3 },
            }}
        >
            <Stack spacing={3}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 5,
                        p: { xs: 2.5, md: 3 },
                        border: "1px solid",
                        borderColor: "divider",
                        background:
                            "linear-gradient(135deg, rgba(25,118,210,0.10) 0%, rgba(255,255,255,1) 45%, rgba(255,255,255,1) 100%)",
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Typography
                                variant="h4"
                                fontWeight={900}
                                sx={{ mb: 1, letterSpacing: "-0.02em" }}
                            >
                                לוח בקרה
                            </Typography>

                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ maxWidth: 700 }}
                            >
                                סקירה מהירה של מצב החשבונות, החובות והתנועות האחרונות במערכת.
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Stack
                                direction={{ xs: "column", sm: "row", md: "column", lg: "row" }}
                                spacing={1.25}
                                justifyContent="flex-end"
                            >
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAddAlt1RoundedIcon />}
                                    onClick={() => navigate("/customers")}
                                    sx={{ borderRadius: 3, px: 2 }}
                                >
                                    לקוח חדש
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<RequestQuoteRoundedIcon />}
                                    onClick={() => navigate("/quotes")}
                                    sx={{ borderRadius: 3, px: 2 }}
                                >
                                    הצעת מחיר
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>

                {loading ? (
                    <LoadingCards />
                ) : (
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="סך כל החובות"
                                value={`${Number(stats.totalDebt || 0).toLocaleString()} ₪`}
                                subtitle="יתרת חוב פתוחה של כלל הלקוחות"
                                icon={<AccountBalanceWalletRoundedIcon />}
                                color="error.main"
                                bg="linear-gradient(135deg, #ffffff 0%, #fff7f7 100%)"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="לקוחות עם חוב"
                                value={Number(
                                    stats.customersInDebtCount || 0
                                ).toLocaleString()}
                                subtitle="מספר החשבונות הפתוחים עם יתרת חוב"
                                icon={<PeopleAltRoundedIcon />}
                                color="primary.main"
                                bg="linear-gradient(135deg, #ffffff 0%, #f5f9ff 100%)"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="חשבונות בארכיון"
                                value={Number(
                                    stats.archivedAccountsCount || 0
                                ).toLocaleString()}
                                subtitle="חשבונות שנסגרו והועברו לארכיון"
                                icon={<ArchiveRoundedIcon />}
                                color="warning.main"
                                bg="linear-gradient(135deg, #ffffff 0%, #fffaf2 100%)"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="תנועות היום"
                                value={Number(
                                    stats.todayTransactionsCount || 0
                                ).toLocaleString()}
                                subtitle="מספר התנועות שנרשמו היום"
                                icon={<ReceiptLongRoundedIcon />}
                                color="success.main"
                                bg="linear-gradient(135deg, #ffffff 0%, #f4fff8 100%)"
                            />
                        </Grid>
                    </Grid>
                )}

                <Box>
                    <Typography
                        variant="h6"
                        fontWeight={900}
                        sx={{ mb: 1.5, px: 0.5 }}
                    >
                        פעולות מהירות
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="ניהול לקוחות"
                                subtitle="צפייה, הוספה ועריכה של לקוחות"
                                icon={<PeopleAltRoundedIcon />}
                                onClick={() => navigate("/customers")}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="פריטים"
                                subtitle="ניהול פריטים וחיפוש מהיר"
                                icon={<Inventory2RoundedIcon />}
                                onClick={() => navigate("/items")}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="הצעות מחיר"
                                subtitle="יצירה וניהול של הצעות מחיר"
                                icon={<RequestQuoteRoundedIcon />}
                                onClick={() => navigate("/quotes")}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="הגדרות"
                                subtitle="פרטי העסק, אבטחה והגדרות מערכת"
                                icon={<SettingsRoundedIcon />}
                                onClick={() => navigate("/settings")}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {loading ? (
                    <Grid container spacing={2}>
                        <Grid item xs={12} lg={7}>
                            <LoadingSection lines={6} />
                        </Grid>
                        <Grid item xs={12} lg={5}>
                            <LoadingSection lines={5} />
                        </Grid>
                    </Grid>
                ) : (
                    <Grid container spacing={2}>
                        <Grid item xs={12} lg={7}>
                            <SectionCard title="תנועות אחרונות" icon={<HistoryRoundedIcon />}>
                                {stats.latestTransactions.length === 0 ? (
                                    <EmptyState
                                        title="אין עדיין תנועות"
                                        subtitle="כאשר יתווספו חובות, תשלומים או החזרות, הן יופיעו כאן."
                                    />
                                ) : (
                                    <List disablePadding>
                                        {stats.latestTransactions.map((tx, index) => (
                                            <Box key={tx._id || index}>
                                                <ListItem
                                                    sx={{
                                                        px: 0,
                                                        py: 1.6,
                                                        alignItems: "flex-start",
                                                        cursor: tx.customerId ? "pointer" : "default",
                                                        "&:hover": {
                                                            bgcolor: "action.hover",
                                                        }
                                                    }}
                                                    onClick={() =>
                                                        tx.customerId && navigate(`/account/${tx.customerId}`)
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Stack
                                                                direction="row"
                                                                justifyContent="space-between"
                                                                alignItems="center"
                                                                spacing={2}
                                                            >
                                                                <Typography fontWeight={800}>
                                                                    {tx.customerName}
                                                                </Typography>

                                                                <Typography
                                                                    fontWeight={900}
                                                                    sx={{
                                                                        color: getTransactionColor(tx.type),
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                >
                                                                    {getTransactionPrefix(tx.type)}
                                                                    {Number(tx.amount || 0).toLocaleString()} ₪
                                                                </Typography>
                                                            </Stack>
                                                        }
                                                        secondary={
                                                            <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                >
                                                                    {getTransactionLabel(tx.type)}
                                                                    {tx.description ? ` • ${tx.description}` : ""}
                                                                </Typography>

                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                >
                                                                    {new Date(tx.date).toLocaleString("he-IL")}
                                                                </Typography>
                                                            </Stack>
                                                        }
                                                    />
                                                </ListItem>

                                                {index !== stats.latestTransactions.length - 1 && (
                                                    <Divider />
                                                )}
                                            </Box>
                                        ))}
                                    </List>
                                )}
                            </SectionCard>
                        </Grid>

                        <Grid item xs={12} lg={5}>
                            <SectionCard
                                title="הלקוחות עם החוב הגבוה ביותר"
                                icon={<TrendingUpRoundedIcon />}
                            >
                                {stats.topDebtors.length === 0 ? (
                                    <EmptyState
                                        title="אין כרגע חובות פתוחים"
                                        subtitle="כאשר יהיו חשבונות פתוחים עם יתרת חוב, הם יופיעו כאן."
                                    />
                                ) : (
                                    <List disablePadding>
                                        {stats.topDebtors.map((customer, index) => (
                                            <Box key={customer._id || index}>
                                                <ListItem
                                                    sx={{
                                                        px: 0, py: 1.6, cursor: "pointer", "&:hover": {
                                                            bgcolor: "action.hover",
                                                        }
                                                    }}
                                                    onClick={() => customer.customerId && navigate(`/account/${customer.customerId}`)}                                              >                          <ListItemText
                                                        primary={
                                                            <Stack
                                                                direction="row"
                                                                justifyContent="space-between"
                                                                alignItems="center"
                                                                spacing={2}
                                                            >
                                                                <Typography fontWeight={700}>
                                                                    {customer.name}
                                                                </Typography>

                                                                <Typography
                                                                    fontWeight={900}
                                                                    color="error.main"
                                                                    sx={{ whiteSpace: "nowrap" }}
                                                                >
                                                                    {Number(customer.balance || 0).toLocaleString()} ₪
                                                                </Typography>
                                                            </Stack>
                                                        }
                                                    />
                                                </ListItem>

                                                {index !== stats.topDebtors.length - 1 && <Divider />}
                                            </Box>
                                        ))}
                                    </List>
                                )}
                            </SectionCard>
                        </Grid>
                    </Grid>
                )}
            </Stack>
        </Box>
    );
}