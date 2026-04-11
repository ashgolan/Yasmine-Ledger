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
    price: {
      type: Number,
      required: [true, "יש להזין מחיר"],
      min: [0, "מחיר לא יכול להיות שלילי"],
      default: 0,
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
  {
    timestamps: true,
  }
);

const Item = mongoose.model("Item", itemSchema);

export default Item;