import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { globalSearch } from "../controllers/search.controller.js";

const router = express.Router();

router.get("/global", protect, globalSearch);

export default router;