import express from "express";
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  getDeliveryNoteCountByCustomer,
  convertDeliveryNoteToAccount,
  updateDeliveryNote,
  syncDeliveryNoteToAccount,
} from "../controllers/deliveryNotes.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/",                                   getDeliveryNotes);
router.post("/",                                  createDeliveryNote);
router.get("/customer/:customerId/count",         getDeliveryNoteCountByCustomer);
router.get("/:noteId",                            getDeliveryNoteById);
router.put("/:noteId",                            updateDeliveryNote);
router.post("/:noteId/convert",                   convertDeliveryNoteToAccount);
router.post("/:noteId/sync",                      syncDeliveryNoteToAccount);

export default router;
