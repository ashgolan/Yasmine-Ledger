import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "יש להזין שם פריט"],
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    costPrice: {
      type: Number,
      min: [0, "מחיר עלות לא יכול להיות שלילי"],
      default: 0,
    },
    profitMargin: {
      type: Number,
      min: [0, "אחוז רווח לא יכול להיות שלילי"],
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "יש להזין מחיר מכירה"],
      min: [0, "מחיר לא יכול להיות שלילי"],
      default: 0,
    },
    barcode: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

itemSchema.index({ createdBy: 1, barcode: 1 });
itemSchema.index({ createdBy: 1, name: 1 });

const Item = mongoose.model("Item", itemSchema);
export default Item;
