import express from "express";
import { createItem, getItems } from "../controllers/item.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getItems);
router.post("/", protect, createItem);

export default router;