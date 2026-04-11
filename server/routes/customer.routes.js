import express from "express";
import { getCustomers } from "../controllers/customer.controller.js";
import { createCustomer } from "../controllers/customer.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getCustomers);
router.post("/", protect, createCustomer);

export default router;