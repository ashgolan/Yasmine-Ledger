import express from "express";
import {
  getMySettings,
  updateMySettings,
  updateSecuritySettings,
} from "../controllers/setting.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getMySettings);
router.put("/", protect, updateMySettings);
router.put("/security", protect, updateSecuritySettings);
export default router;