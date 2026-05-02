import express from "express";
import multer from "multer";
import { exportCustomersExcel, exportCustomersJson, getDashboardStats, importBackup } from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get("/stats", protect, getDashboardStats);
router.get("/export-customers", protect, exportCustomersExcel);
router.get("/export-customers-json", protect, exportCustomersJson);
router.post("/import-backup", protect, upload.single("backup"), importBackup);

export default router;