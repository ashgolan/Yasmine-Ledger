import express from "express";
import { exportCustomersExcel, exportCustomersJson, getDashboardStats } from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// dashboard.routes.js
router.get("/stats", protect, getDashboardStats);
router.get("/export-customers", protect, exportCustomersExcel);
router.get("/export-customers-json", protect, exportCustomersJson);  // ← جديد
export default router;