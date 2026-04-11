import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Stack,
    TextField,
    Button,
    Alert,
    Divider,
} from "@mui/material";
import { api } from "../api/axios";

export default function SettingsPage() {
    const [form, setForm] = useState({
        storeName: "",
        storePhone: "",
        storeAddress: "",
        footerText: "",
    });

    const [securityForm, setSecurityForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        newLockCode: "",
        confirmNewLockCode: "",
    });

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [loadingGeneral, setLoadingGeneral] = useState(false);
    const [loadingSecurity, setLoadingSecurity] = useState(false);

    const fetchSettings = async () => {
        try {
            setError("");

            const res = await api.get("/settings");

            setForm({
                storeName: res.data.storeName || "",
                storePhone: res.data.storePhone || "",
                storeAddress: res.data.storeAddress || "",
                footerText: res.data.footerText || "",
            });
        } catch (err) {
            setError(err.response?.data?.message || "שגיאה בטעינת ההגדרות");
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        try {
            setSuccess("");
            setError("");
            setLoadingGeneral(true);

            const res = await api.put("/settings", form);

            setSuccess(res.data.message || "ההגדרות נשמרו בהצלחה.");
        } catch (err) {
            setError(err.response?.data?.message || "שגיאה בשמירת ההגדרות");
        } finally {
            setLoadingGeneral(false);
        }
    };
    const handleSaveSecurity = async () => {
        try {
            setSuccess("");
            setError("");

            if (!securityForm.currentPassword.trim()) {
                setError("יש להזין את הסיסמה הנוכחית.");
                return;
            }

            if (
                !securityForm.newPassword.trim() &&
                !securityForm.newLockCode.trim()
            ) {
                setError("יש להזין סיסמה חדשה או קוד נעילה חדש.");
                return;
            }

            if (
                securityForm.newPassword.trim() &&
                securityForm.newPassword !== securityForm.confirmNewPassword
            ) {
                setError("אימות הסיסמה החדשה אינו תואם.");
                return;
            }

            if (
                securityForm.newLockCode.trim() &&
                securityForm.newLockCode !== securityForm.confirmNewLockCode
            ) {
                setError("אימות קוד הנעילה אינו תואם.");
                return;
            }

            setLoadingSecurity(true);

            const res = await api.put("/settings/security", {
                currentPassword: securityForm.currentPassword,
                newPassword: securityForm.newPassword,
                newLockCode: securityForm.newLockCode,
            });

            setSuccess(res.data.message || "הגדרות האבטחה נשמרו בהצלחה.");

            setSecurityForm({
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
                newLockCode: "",
                confirmNewLockCode: "",
            });
        } catch (err) {
            setError(
                err.response?.data?.message || "שגיאה בשמירת הגדרות האבטחה"
            );
        } finally {
            setLoadingSecurity(false);
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h4" mb={3}>
                הגדרות
            </Typography>

            <Paper sx={{ p: 3, maxWidth: 800 }}>
                <Stack spacing={2.5}>
                    {success ? <Alert severity="success">{success}</Alert> : null}
                    {error ? <Alert severity="error">{error}</Alert> : null}

                    <Typography variant="h6">פרטי העסק</Typography>

                    <TextField
                        label="שם העסק"
                        value={form.storeName}
                        onChange={(e) =>
                            setForm({ ...form, storeName: e.target.value })
                        }
                        fullWidth
                    />

                    <TextField
                        label="טלפון העסק"
                        value={form.storePhone}
                        onChange={(e) =>
                            setForm({ ...form, storePhone: e.target.value })
                        }
                        fullWidth
                    />

                    <TextField
                        label="כתובת העסק"
                        value={form.storeAddress}
                        onChange={(e) =>
                            setForm({ ...form, storeAddress: e.target.value })
                        }
                        fullWidth
                    />

                    <TextField
                        label="טקסט תחתון להדפסה"
                        value={form.footerText}
                        onChange={(e) =>
                            setForm({ ...form, footerText: e.target.value })
                        }
                        fullWidth
                        multiline
                        minRows={3}
                    />

                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loadingGeneral}
                    >
                        שמור הגדרות עסק
                    </Button>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="h6">אבטחה</Typography>

                    <TextField
                        label="סיסמה נוכחית"
                        type="password"
                        value={securityForm.currentPassword}
                        onChange={(e) =>
                            setSecurityForm({
                                ...securityForm,
                                currentPassword: e.target.value,
                            })
                        }
                        fullWidth
                    />

                    <TextField
                        label="סיסמה חדשה"
                        type="password"
                        value={securityForm.newPassword}
                        onChange={(e) =>
                            setSecurityForm({
                                ...securityForm,
                                newPassword: e.target.value,
                            })
                        }
                        fullWidth
                    />

                    <TextField
                        label="אימות סיסמה חדשה"
                        type="password"
                        value={securityForm.confirmNewPassword}
                        onChange={(e) =>
                            setSecurityForm({
                                ...securityForm,
                                confirmNewPassword: e.target.value,
                            })
                        }
                        fullWidth
                    />

                    <TextField
                        label="קוד נעילה חדש"
                        type="password"
                        value={securityForm.newLockCode}
                        onChange={(e) =>
                            setSecurityForm({
                                ...securityForm,
                                newLockCode: e.target.value,
                            })
                        }
                        fullWidth
                    />

                    <TextField
                        label="אימות קוד נעילה חדש"
                        type="password"
                        value={securityForm.confirmNewLockCode}
                        onChange={(e) =>
                            setSecurityForm({
                                ...securityForm,
                                confirmNewLockCode: e.target.value,
                            })
                        }
                        fullWidth
                    />

                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleSaveSecurity}
                        disabled={loadingSecurity}
                    >
                        שמור הגדרות אבטחה
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}