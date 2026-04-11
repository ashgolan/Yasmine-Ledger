import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import { api } from "../api/axios";

export default function LockScreen({ onUnlock }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    try {
      setError("");
      setLoading(true);

      await api.post("/auth/verify-lock-code", {
        lockCode: code,
      });

      setCode("");
      onUnlock();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בפתיחת הנעילה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <Paper sx={{ p: 4, minWidth: 340, borderRadius: 3 }}>
        <Typography variant="h6" mb={2} fontWeight={700}>
          המערכת נעולה
        </Typography>

        <Typography color="text.secondary" mb={2}>
          יש להזין קוד כדי לפתוח את המערכת
        </Typography>

        <TextField
          label="קוד פתיחה"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
          type="password"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUnlock();
          }}
        />

        {error ? (
          <Typography color="error" mt={1}>
            {error}
          </Typography>
        ) : null}

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleUnlock}
          disabled={loading}
        >
          פתיחה
        </Button>
      </Paper>
    </Box>
  );
}