import express from "express";
import {
  getCustomerAccount,
  archiveAccount,
  getCustomerArchivedAccounts,
  getArchivedAccountDetails,
} from "../controllers/account.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/customer/:customerId/open", protect, getCustomerAccount);
router.get("/customer/:customerId/archived", protect, getCustomerArchivedAccounts);
router.get("/archived/:accountId", protect, getArchivedAccountDetails);
router.post("/archive/:accountId", protect, archiveAccount);

export default router;