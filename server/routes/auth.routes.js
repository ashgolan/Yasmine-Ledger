import express from "express";
import {
  login,
  logout,
  getMe,
  verifyLockCode,
  checkSetup,
  register,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/check-setup", checkSetup);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/verify-lock-code", protect, verifyLockCode);

export default router;