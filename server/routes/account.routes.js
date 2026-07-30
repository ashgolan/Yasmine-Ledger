import express from "express";
import {
  getCustomerAccount,
  archiveAccount,
  getCustomerArchivedAccounts,
  getArchivedAccountDetails,
  addInvoice,
  updateInvoice,
  deleteInvoice,
} from "../controllers/account.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/customer/:customerId/open", protect, getCustomerAccount);
router.get("/customer/:customerId/archived", protect, getCustomerArchivedAccounts);
router.get("/archived/:accountId", protect, getArchivedAccountDetails);
router.post("/archive/:accountId", protect, archiveAccount);
router.post("/:accountId/invoices", protect, addInvoice);
router.put("/:accountId/invoices/:invoiceId", protect, updateInvoice);
router.delete("/:accountId/invoices/:invoiceId", protect, deleteInvoice);

export default router;