import express from "express";
import {
  createQuote,
  getQuotes,
  getQuoteById,
  convertQuoteToAccount,
} from "../controllers/quote.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getQuotes);
router.get("/:quoteId", protect, getQuoteById);
router.post("/", protect, createQuote);
router.post("/:quoteId/convert", protect, convertQuoteToAccount);
export default router;