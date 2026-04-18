import mongoose from "mongoose";

const deliveryItemSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    quantity: { type: Number, min: 0, default: 1 },
    unitPrice: { type: Number, min: 0, default: 0 }, // مخزن لكن مخفي في الطباعة
    amount: { type: Number, min: 0, default: 0 },    // مخزن لكن مخفي في الطباعة
    note: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { _id: false }
);

const deliveryNoteSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: { type: String, trim: true, maxlength: 120, default: "" },
    customerPhone: { type: String, trim: true, maxlength: 30, default: "" },
    noteNumber: { type: String, trim: true, required: true, unique: true }, // DN-0001
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["draft", "converted"],
      default: "draft",
    },
    items: { type: [deliveryItemSchema], default: [] },
    total: { type: Number, min: 0, default: 0 },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    convertedAt: { type: Date, default: null },
    convertedAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    // لتتبع التعديل بعد التحويل
    isDirty: { type: Boolean, default: false },
    // مصدر الإنشاء — من هצעת מחיר أو مباشر
    sourceQuote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const DeliveryNote = mongoose.model("DeliveryNote", deliveryNoteSchema);
export default DeliveryNote;