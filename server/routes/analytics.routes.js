import express from "express";
import { getAnalyticsOverview, getDebtDistribution } from "../controllers/analytics.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET /analytics/overview?period=day|week|month|year
router.get("/overview", protect, getAnalyticsOverview);

// GET /analytics/debt-distribution
router.get("/debt-distribution", protect, getDebtDistribution);

export default router;
