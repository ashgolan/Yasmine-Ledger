import express from "express";
import {
  createQuote,
  getQuotes,
  getQuoteById,
  getQuoteCountByCustomer,
  convertQuoteToAccount,
} from "../controllers/quote.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getQuotes);
router.get("/customer/:customerId/count", protect, getQuoteCountByCustomer);
router.get("/:quoteId", protect, getQuoteById);
router.post("/", protect, createQuote);
router.post("/:quoteId/convert", protect, convertQuoteToAccount);

export default router;
