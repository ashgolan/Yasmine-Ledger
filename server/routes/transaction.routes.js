import express from "express";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, addTransaction);
router.put("/:transactionId", protect, updateTransaction);
router.delete("/:transactionId", protect, deleteTransaction);

export default router;