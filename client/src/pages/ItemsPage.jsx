import { useEffect, useState } from "react";
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
} from "@mui/material";
import { api } from "../api/axios";

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
  });
  const [error, setError] = useState("");

  const fetchItems = async () => {
    try {
      const res = await api.get("/items");
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בטעינת פריטים");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async () => {
    try {
      setError("");

      if (!form.name.trim()) {
        setError("יש להזין שם פריט");
        return;
      }

      await api.post("/items", {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price || 0),
      });

      setForm({ name: "", category: "", price: "" });
      setOpen(false);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה ביצירת פריט");
    }
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h4">פריטים</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          פריט חדש
        </Button>
      </Stack>

      {error ? (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      ) : null}

      <Paper>
        <Stack>
          {items.map((item) => (
            <Box
              key={item._id}
              sx={{ p: 2, borderBottom: "1px solid #eee" }}
            >
              <Typography fontWeight={600}>{item.name}</Typography>
              <Typography color="text.secondary">
                {item.category || "-"} | {item.price} ₪
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>פריט חדש</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="שם פריט"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="קטגוריה"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <TextField
              label="מחיר"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>ביטול</Button>
          <Button variant="contained" onClick={handleCreate}>
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}