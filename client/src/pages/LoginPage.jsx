import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password) {
      setError("יש למלא את כל השדות");
      return;
    }

    try {
      setLoading(true);
      await login(form);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper sx={{ p: 4, width: 400, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h4" fontWeight={700}>
            Yasmine Ledger
          </Typography>

          <Typography color="text.secondary">
            התחברות למערכת
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="שם משתמש"
                name="username"
                value={form.username}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="סיסמה"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
              >
                התחבר
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}